package com.smarthealthcare.ai_doctor_suggestion.service;

import com.smarthealthcare.ai_doctor_suggestion.config.OllamaProperties;
import com.smarthealthcare.ai_doctor_suggestion.config.OllamaRuntimeState;
import com.smarthealthcare.ai_doctor_suggestion.exception.EmbeddingServiceException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class OllamaStartupInitializer implements ApplicationRunner {

    private final RestTemplate restTemplate;
    private final OllamaProperties ollamaProperties;
    private final OllamaRuntimeState ollamaRuntimeState;

    @Override
    public void run(ApplicationArguments args) {
        OllamaProperties.Startup startup = ollamaProperties.startup();
        if (startup == null || !startup.enabled()) {
            return;
        }

        String configuredBaseUrl = ollamaProperties.baseUrl();
        String model = ollamaProperties.embedding().model();
        String ollamaExecutable = resolveOllamaExecutable();
        List<String> candidateBaseUrls = buildCandidateBaseUrls(configuredBaseUrl, startup.fallbackPorts());

        String activeBaseUrl = null;
        for (String candidate : candidateBaseUrls) {
            if (isApiReachable(candidate)) {
                activeBaseUrl = candidate;
                break;
            }

            if (startup.autoStartCli()) {
                log.info("Ollama API unavailable at {}. Attempting to start 'ollama serve' on this endpoint...",
                        candidate);
                startOllamaServe(ollamaExecutable, candidate);
                if (waitForApi(candidate, startup.readinessAttempts(), startup.readinessIntervalMs())) {
                    activeBaseUrl = candidate;
                    break;
                }
            }
        }

        if (activeBaseUrl == null) {
            String message = "Ollama API is not reachable on any candidate endpoint: " + candidateBaseUrls;
            if (startup.failFastIfUnavailable()) {
                throw new EmbeddingServiceException(message);
            }
            log.warn("{}; continuing startup because failFastIfUnavailable=false", message);
            return;
        }

        ollamaRuntimeState.setActiveBaseUrl(activeBaseUrl);
        log.info("Using Ollama endpoint: {}", activeBaseUrl);

        if (startup.autoPullModel()) {
            String ollamaHost = toOllamaHost(activeBaseUrl);
            ensureModelPulled(model, startup.failFastIfUnavailable(), ollamaHost);
        }
    }

    private boolean isApiReachable(String baseUrl) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/api/tags",
                    HttpMethod.GET,
                    null,
                    String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException ex) {
            return false;
        }
    }

    private boolean waitForApi(String baseUrl, int attempts, long intervalMs) {
        int safeAttempts = Math.max(attempts, 1);
        long safeInterval = Math.max(intervalMs, 250L);

        for (int i = 1; i <= safeAttempts; i++) {
            if (isApiReachable(baseUrl)) {
                return true;
            }
            log.info("Waiting for Ollama API... attempt {}/{}", i, safeAttempts);
            try {
                Thread.sleep(safeInterval);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return false;
            }
        }

        return false;
    }

    private void startOllamaServe(String executable, String baseUrl) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(executable, "serve");
            processBuilder.environment().put("OLLAMA_HOST", toOllamaHost(baseUrl));
            processBuilder
                    .redirectErrorStream(true)
                    .start();
        } catch (IOException ex) {
            throw new EmbeddingServiceException("Unable to start 'ollama serve'. Is Ollama installed?", ex);
        }
    }

    private void ensureModelPulled(String model, boolean failFast, String ollamaHost) {
        try {
            CommandResult listResult = runOllamaCommand(ollamaHost, "list");
            if (listResult.exitCode() != 0) {
                String message = "Failed to run 'ollama list'";
                if (failFast) {
                    throw new EmbeddingServiceException(message + ": " + listResult.output());
                }
                log.warn("{}: {}", message, listResult.output());
                return;
            }

            if (modelExists(listResult.output(), model)) {
                log.info("Ollama model '{}' is already available", model);
                return;
            }

            log.info("Pulling Ollama model '{}'...", model);
            CommandResult pullResult = runOllamaCommand(ollamaHost, "pull", model);
            if (pullResult.exitCode() != 0) {
                String message = "Failed to pull Ollama model '" + model + "'";
                if (failFast) {
                    throw new EmbeddingServiceException(message + ": " + pullResult.output());
                }
                log.warn("{}: {}", message, pullResult.output());
                return;
            }

            log.info("Ollama model '{}' pulled successfully", model);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            String message = "Failed to ensure Ollama model is available";
            if (failFast) {
                throw new EmbeddingServiceException(message, ex);
            }
            log.warn("{}: {}", message, ex.getMessage());
        } catch (IOException ex) {
            String message = "Failed to ensure Ollama model is available";
            if (failFast) {
                throw new EmbeddingServiceException(message, ex);
            }
            log.warn("{}: {}", message, ex.getMessage());
        }
    }

    private boolean modelExists(String ollamaListOutput, String model) {
        String modelPrefix = model + ":";
        return ollamaListOutput.lines()
                .map(String::trim)
                .anyMatch(line -> line.startsWith(modelPrefix) || line.equals(model));
    }

    private CommandResult runOllamaCommand(String ollamaHost, String... args) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(buildCommand(args));
        processBuilder.environment().put("OLLAMA_HOST", ollamaHost);
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();
        return new CommandResult(exitCode, output.toString().trim());
    }

    private String[] buildCommand(String... args) {
        String[] command = new String[args.length + 1];
        command[0] = resolveOllamaExecutable();
        System.arraycopy(args, 0, command, 1, args.length);
        return command;
    }

    private String resolveOllamaExecutable() {
        try {
            ProcessBuilder check = new ProcessBuilder("ollama", "--version");
            check.redirectErrorStream(true);
            Process process = check.start();
            process.waitFor();
            if (process.exitValue() == 0) {
                return "ollama";
            }
        } catch (IOException | InterruptedException ignored) {
            if (ignored instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }

        String localAppData = System.getenv("LOCALAPPDATA");
        if (localAppData != null && !localAppData.isBlank()) {
            String fallback = localAppData + "\\Programs\\Ollama\\ollama.exe";
            return fallback;
        }
        return "ollama";
    }

    private List<String> buildCandidateBaseUrls(String configuredBaseUrl, String fallbackPorts) {
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(normalizeBaseUrl(configuredBaseUrl));

        String host = hostFromUrl(configuredBaseUrl);
        for (Integer port : parsePorts(fallbackPorts)) {
            candidates.add("http://" + host + ":" + port);
        }

        return new ArrayList<>(candidates);
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    private String hostFromUrl(String baseUrl) {
        String normalized = normalizeBaseUrl(baseUrl)
                .replace("http://", "")
                .replace("https://", "");
        int colon = normalized.indexOf(':');
        if (colon > 0) {
            return normalized.substring(0, colon);
        }
        int slash = normalized.indexOf('/');
        if (slash > 0) {
            return normalized.substring(0, slash);
        }
        return normalized;
    }

    private List<Integer> parsePorts(String fallbackPorts) {
        String ports = fallbackPorts == null || fallbackPorts.isBlank()
                ? "12000,12001,12002"
                : fallbackPorts;

        List<Integer> parsed = new ArrayList<>();
        for (String token : ports.split(",")) {
            try {
                parsed.add(Integer.parseInt(token.trim()));
            } catch (NumberFormatException ignored) {
                // Ignore invalid port tokens.
            }
        }
        return parsed;
    }

    private String toOllamaHost(String baseUrl) {
        String normalized = normalizeBaseUrl(baseUrl);
        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            return normalized;
        }
        return "http://" + normalized;
    }

    private record CommandResult(int exitCode, String output) {
    }
}
