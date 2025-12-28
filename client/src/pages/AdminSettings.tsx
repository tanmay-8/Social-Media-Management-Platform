import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-green-600" />
          System Settings
        </h1>
        <p className="text-slate-600 mt-1">Configure platform settings and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform Name</label>
              <input
                type="text"
                defaultValue="Social Media Management"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                defaultValue="support@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cloudinary Status</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Connected
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta API Status</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Subscription Plans</h2>
          <div className="space-y-3">
            {[
              { months: 1, price: 299 },
              { months: 3, price: 699 },
              { months: 6, price: 1199 },
              { months: 12, price: 1999 },
            ].map((plan) => (
              <div key={plan.months} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="font-medium text-slate-900">{plan.months} Month{plan.months > 1 ? 's' : ''}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">₹{plan.price}</span>
                  <input
                    type="number"
                    defaultValue={plan.price}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
