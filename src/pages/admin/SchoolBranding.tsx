import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { School as SchoolIcon, Save, Image as ImageIcon, Phone, Mail, MapPin } from 'lucide-react';
import { School } from '../../types';

const SchoolBranding: React.FC = () => {
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    principalSignatureUrl: '',
    schoolStampUrl: '',
  });

  useEffect(() => {
    const fetchSchool = async () => {
      if (!profile?.schoolId) return;
      try {
        const snap = await getDoc(doc(db, 'schools', profile.schoolId));
        if (snap.exists()) {
          const data = snap.data() as School;
          setSchool(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            logoUrl: data.logoUrl || '',
            principalSignatureUrl: data.principalSignatureUrl || '',
            schoolStampUrl: data.schoolStampUrl || '',
          });
        }
      } catch (error) {
        console.error("Error fetching school:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'schools', profile.schoolId), formData);
      alert('School branding updated successfully!');
    } catch (error) {
      console.error("Error updating school:", error);
      alert('Failed to update school branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-8"><div className="h-64 bg-gray-200 rounded-2xl"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">School Branding</h2>
        <p className="text-gray-500">Configure your school's identity and report card assets.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-4">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <div className="mt-1 relative">
                <SchoolIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School Email</label>
              <div className="mt-1 relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <div className="mt-1 relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-4">Branding Assets (URLs)</h3>
          <p className="text-sm text-gray-500 italic">Provide URLs for your school's visual assets. These will appear on report cards.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">School Logo URL</label>
              <div className="mt-1 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-gray-300" />}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-xl py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Principal's Signature URL</label>
              <div className="mt-1 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.principalSignatureUrl ? <img src={formData.principalSignatureUrl} alt="Sig" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-gray-300" />}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/signature.png"
                  value={formData.principalSignatureUrl}
                  onChange={(e) => setFormData({ ...formData, principalSignatureUrl: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-xl py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">School Stamp URL</label>
              <div className="mt-1 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.schoolStampUrl ? <img src={formData.schoolStampUrl} alt="Stamp" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-gray-300" />}
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/stamp.png"
                  value={formData.schoolStampUrl}
                  onChange={(e) => setFormData({ ...formData, schoolStampUrl: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-xl py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving Changes...' : 'Save Branding Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchoolBranding;
