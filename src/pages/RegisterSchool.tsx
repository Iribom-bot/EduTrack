import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { School as SchoolIcon, ArrowLeft } from 'lucide-react';

const RegisterSchool: React.FC = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Admin User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.adminEmail, formData.password);
      const user = userCredential.user;

      // 2. Create School Document
      const schoolRef = await addDoc(collection(db, 'schools'), {
        name: formData.schoolName,
        email: formData.schoolEmail,
        phone: formData.phone,
        address: formData.address,
        adminId: user.uid,
        createdAt: new Date().toISOString(),
      });

      // 3. Create User Profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.adminEmail,
        role: 'school_admin',
        schoolId: schoolRef.id,
        fullName: formData.adminName,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register school.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/login" className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-6 font-medium transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </Link>
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <SchoolIcon size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Register Your School
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the EduTrack platform today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">School Information</h3>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">School Name</label>
                <input
                  type="text"
                  name="schoolName"
                  id="schoolName"
                  required
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="schoolEmail" className="block text-sm font-medium text-gray-700">School Email</label>
                <input
                  type="email"
                  name="schoolEmail"
                  id="schoolEmail"
                  required
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">School Address</label>
                <textarea
                  name="address"
                  id="address"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 mt-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Admin Account</h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Admin Full Name</label>
                <input
                  type="text"
                  name="adminName"
                  id="adminName"
                  required
                  value={formData.adminName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Admin Email (Login Email)</label>
                <input
                  type="email"
                  name="adminEmail"
                  id="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Registering...' : 'Register School & Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterSchool;
