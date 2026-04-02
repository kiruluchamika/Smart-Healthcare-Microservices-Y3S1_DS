import { useEffect, useState } from 'react';
import { getAdminSystemSettings, updateAdminSystemSettings } from '../../services/adminApi';
import type { AdminSystemSettings } from '../../types/admin';

const defaultSettings: AdminSystemSettings = {
  sessionTimeoutMinutes: 15,
  maintenanceMode: false,
  registrationsEnabled: true,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSystemSettings>(defaultSettings);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await getAdminSystemSettings();
        setSettings(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const validate = () => {
    if (!Number.isFinite(settings.sessionTimeoutMinutes)) {
      return 'Session timeout must be a number';
    }

    if (settings.sessionTimeoutMinutes < 5 || settings.sessionTimeoutMinutes > 1440) {
      return 'Session timeout must be between 5 and 1440 minutes';
    }

    return '';
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateAdminSystemSettings(settings);
      setSettings(response);
      setSuccessMessage('Settings updated successfully');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-slate-900">System Settings</h2>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {successMessage && <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading current settings...</p>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Session Timeout (minutes)</span>
              <input
                type="number"
                min={5}
                max={1440}
                value={settings.sessionTimeoutMinutes}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    sessionTimeoutMinutes: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(event) => setSettings((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">Allow New Registrations</span>
              <input
                type="checkbox"
                checked={settings.registrationsEnabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, registrationsEnabled: event.target.checked }))}
                className="h-4 w-4"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
