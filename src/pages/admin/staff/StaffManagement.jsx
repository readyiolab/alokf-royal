// pages/admin/staff/StaffManagement.jsx
// Staff Management - Dark Theme with Gold Accents (Like Casino Style)

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Shield, 
  UserCheck, Phone, Calendar, Sun, Moon, X, Loader2,
  Crown, Briefcase, Sparkles, Home, Megaphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import AdminLayout from '../../../components/layouts/AdminLayout';
import staffService from '../../../services/staff.service';

const StaffManagement = () => {
  // States
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [staffForm, setStaffForm] = useState({
    staff_name: '',
    phone_number: '',
    staff_role: 'dealer',
    monthly_salary: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    shift: 'day',
    experience_years: '',
    notes: ''
  });

  // Staff categories with icons and colors
  const staffCategories = [
    { 
      key: 'floor_manager', 
      label: 'Floor Manager', 
      icon: Crown, 
      description: 'Admin & Management',
      color: 'from-amber-600 to-yellow-500'
    },
    { 
      key: 'dealer', 
      label: 'Dealers', 
      icon: Sparkles, 
      description: 'Game Dealers',
      color: 'from-emerald-600 to-green-500'
    },
    { 
      key: 'security', 
      label: 'Security / Bouncers', 
      icon: Shield, 
      description: 'Security Staff',
      color: 'from-red-600 to-rose-500'
    },
    { 
      key: 'housekeeping', 
      label: 'Housekeeping', 
      icon: Home, 
      description: 'Cleaning & Maintenance',
      color: 'from-blue-600 to-cyan-500'
    },
    { 
      key: 'receptionist', 
      label: 'Receptionist', 
      icon: UserCheck, 
      description: 'Front Desk',
      color: 'from-pink-600 to-rose-400'
    },
    { 
      key: 'marketing', 
      label: 'Marketing', 
      icon: Megaphone, 
      description: 'Marketing Team',
      color: 'from-purple-600 to-violet-500'
    }
  ];

  const staffRoles = [
    { value: 'floor_manager', label: 'Floor Manager' },
    { value: 'dealer', label: 'Dealer' },
    { value: 'security', label: 'Security / Bouncer' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'marketing', label: 'Marketing' }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffService.getAllStaff();
      setStaff(response.data || []);
    } catch (err) {
      setError('Failed to fetch staff');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingStaff) {
        await staffService.updateStaff(editingStaff.staff_id, staffForm);
        setSuccess('Staff member updated successfully!');
      } else {
        await staffService.createStaff(staffForm);
        setSuccess('Staff member added successfully!');
      }
      setShowAddModal(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setStaffForm({
      staff_name: member.staff_name || '',
      phone_number: member.phone_number || '',
      staff_role: member.staff_role || 'dealer',
      monthly_salary: member.monthly_salary || '',
      date_of_joining: member.date_of_joining ? member.date_of_joining.split('T')[0] : '',
      shift: member.shift || 'day',
      experience_years: member.experience_years || '',
      notes: member.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await staffService.deleteStaff(staffId);
      setSuccess('Staff member deleted successfully!');
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setStaffForm({
      staff_name: '',
      phone_number: '',
      staff_role: 'dealer',
      monthly_salary: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      shift: 'day',
      experience_years: '',
      notes: ''
    });
    setError('');
  };

  const getStaffByCategory = (category) => {
    return staff.filter(member => member.staff_role === category);
  };

  const formatExperience = (years) => {
    if (!years) return 'New';
    return years === 1 ? '1 year' : `${years} years`;
  };

  const getCategoryInfo = (role) => {
    return staffCategories.find(c => c.key === role) || staffCategories[1];
  };

  // Staff Card Component
  const StaffCard = ({ member }) => {
    const shift = member.shift || 'day';
    
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-amber-500/30 transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-white font-semibold text-lg">{member.staff_name}</h4>
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" />
              +91 {member.phone_number}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Experience: {formatExperience(member.experience_years)}
            </p>
          </div>
          
          {/* Shift Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            shift === 'day' 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {shift === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            {shift === 'day' ? 'Day' : 'Night'}
          </span>
        </div>
        
        {/* Action buttons - show on hover */}
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(member)}
            className="flex-1 py-1.5 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs flex items-center justify-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(member.staff_id)}
            className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Category Section Component
  const CategorySection = ({ category }) => {
    const categoryStaff = getStaffByCategory(category.key);
    const IconComponent = category.icon;
    
    if (categoryStaff.length === 0) return null;
    
    return (
      <div className="mb-8">
        {/* Category Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-amber-400 font-semibold text-lg uppercase tracking-wide">
              {category.label}
            </h3>
          </div>
          <span className="ml-auto bg-gray-700/50 px-3 py-1 rounded-full text-gray-400 text-sm">
            {categoryStaff.length} staff
          </span>
        </div>
        
        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStaff.map(member => (
            <StaffCard key={member.staff_id} member={member} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-400" />
              Staff Management
            </h1>
            <p className="text-gray-400 mt-1">Manage all staff members across departments</p>
          </div>
          
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {staffCategories.map(category => {
            const count = getStaffByCategory(category.key).length;
            const IconComponent = category.icon;
            
            return (
              <div 
                key={category.key}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-gray-400">{category.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Staff Categories */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {staffCategories.slice(0, 3).map(category => (
                <CategorySection key={category.key} category={category} />
              ))}
            </div>
            
            {/* Right Column */}
            <div>
              {staffCategories.slice(3).map(category => (
                <CategorySection key={category.key} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && staff.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Staff Members</h3>
            <p className="text-gray-500 mb-4">Add your first staff member to get started</p>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        )}

        {/* Add/Edit Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-yellow-500 text-gray-900 rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {editingStaff ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                  </span>
                  <button onClick={() => {setShowAddModal(false); resetForm();}} className="text-gray-900/70 hover:text-gray-900">
                    <X className="w-5 h-5" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-gray-300">Staff Name *</Label>
                      <Input
                        value={staffForm.staff_name}
                        onChange={(e) => setStaffForm({...staffForm, staff_name: e.target.value})}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Enter name"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Phone Number *</Label>
                      <Input
                        value={staffForm.phone_number}
                        onChange={(e) => setStaffForm({...staffForm, phone_number: e.target.value})}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="98765 43210"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Role *</Label>
                      <select
                        value={staffForm.staff_role}
                        onChange={(e) => setStaffForm({...staffForm, staff_role: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        required
                      >
                        {staffRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Monthly Salary</Label>
                      <Input
                        type="number"
                        value={staffForm.monthly_salary}
                        onChange={(e) => setStaffForm({...staffForm, monthly_salary: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="₹10,000"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Experience (Years)</Label>
                      <Input
                        type="number"
                        value={staffForm.experience_years}
                        onChange={(e) => setStaffForm({...staffForm, experience_years: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Joining Date</Label>
                      <Input
                        type="date"
                        value={staffForm.date_of_joining}
                        onChange={(e) => setStaffForm({...staffForm, date_of_joining: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Shift</Label>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setStaffForm({...staffForm, shift: 'day'})}
                          className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            staffForm.shift === 'day'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <Sun className="w-4 h-4" />
                          Day
                        </button>
                        <button
                          type="button"
                          onClick={() => setStaffForm({...staffForm, shift: 'night'})}
                          className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            staffForm.shift === 'night'
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                              : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <Moon className="w-4 h-4" />
                          Night
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-gray-300">Notes</Label>
                      <textarea
                        value={staffForm.notes}
                        onChange={(e) => setStaffForm({...staffForm, notes: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        rows="2"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {setShowAddModal(false); resetForm();}}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        editingStaff ? 'Update Staff' : 'Add Staff'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Toast */}
        {success && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-500/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {success}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;