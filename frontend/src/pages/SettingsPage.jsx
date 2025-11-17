import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary dark:text-light">Settings</h1>
        <p className="text-gray-500">Manage your account and business settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Profile */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4">Business Profile</h2>
          <form className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <input type="text" className="input" placeholder="Your Business Name" />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input type="text" className="input" placeholder="27XXXX1234H1Z5" />
            </div>
            <button className="btn btn-primary">Save Changes</button>
          </form>
        </div>

        {/* Tax Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4">Tax Settings</h2>
          <form className="space-y-4">
            <div>
              <label className="label">GST Rate (%)</label>
              <input type="number" className="input" placeholder="18" />
            </div>
            <div>
              <label className="label">CGST (%)</label>
              <input type="number" className="input" placeholder="9" />
            </div>
            <button className="btn btn-primary">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
