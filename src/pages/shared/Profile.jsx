import React, { useState, useEffect } from 'react';
import { User, Key, Save, Lock, GraduationCap, ShieldAlert, Briefcase, Award, BookOpen } from 'lucide-react';
import { Field, SectionTitle } from '../../components/Shared';

export default function Profile({ user, api, action, refresh }) {
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    rollNumber: user?.rollNumber || '',
    leetcodeUsername: user?.leetcodeUsername || '',
    githubUrl: user?.githubUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
    degree: user?.academicDetails?.degree || '',
    stream: user?.academicDetails?.stream || '',
    passingYear: user?.academicDetails?.passingYear || '',
    cgpa: user?.academicDetails?.cgpa || '',
    skills: user?.skills || '',
    preferredRoles: user?.jobPreference?.preferredRoles || '',
    preferredLocations: user?.jobPreference?.preferredLocations || '',
    expectedCtc: user?.jobPreference?.expectedCtc || '',
    projects: user?.otherDetails?.projects || '',
    certifications: user?.otherDetails?.certifications || ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        rollNumber: user.rollNumber || '',
        leetcodeUsername: user.leetcodeUsername || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        degree: user.academicDetails?.degree || '',
        stream: user.academicDetails?.stream || '',
        passingYear: user.academicDetails?.passingYear || '',
        cgpa: user.academicDetails?.cgpa || '',
        skills: user.skills || '',
        preferredRoles: user.jobPreference?.preferredRoles || '',
        preferredLocations: user.jobPreference?.preferredLocations || '',
        expectedCtc: user.jobPreference?.expectedCtc || '',
        projects: user.otherDetails?.projects || '',
        certifications: user.otherDetails?.certifications || ''
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await action(async () => {
      const updated = await api.postForm('/api/auth/me', formData);
      if (updated && refresh) await refresh('silent');
    }, 'Profile updated successfully');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    await action(async () => {
      await api.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
    }, 'Password updated successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Details Column */}
      <form 
        onSubmit={handleProfileSubmit}
        className="lg:col-span-2 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-5"
      >
        <div className="pb-3 border-b border-borderCool/60 flex items-center justify-between">
          <SectionTitle icon={User} title="Edit Profile Information" />
          {user.batch && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              <GraduationCap size={13} /> {user.batch.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field 
            label="Full Name" 
            name="name" 
            value={profileForm.name} 
            onChange={(v) => setProfileForm(p => ({ ...p, name: v }))} 
            required 
          />
          <Field 
            label="Email Address" 
            name="email" 
            value={profileForm.email} 
            onChange={(v) => setProfileForm(p => ({ ...p, email: v }))} 
            required 
            disabled 
            className="opacity-75"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field 
            label="Mobile Number" 
            name="phone" 
            value={profileForm.phone} 
            onChange={(v) => setProfileForm(p => ({ ...p, phone: v }))} 
          />
          {user.role === 'student' ? (
            <Field 
              label="Roll Number" 
              name="rollNumber" 
              value={profileForm.rollNumber} 
              onChange={(v) => setProfileForm(p => ({ ...p, rollNumber: v }))} 
            />
          ) : (
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-textMuted">Role Status</span>
                <input 
                  type="text" 
                  value="Trainer / Admin" 
                  disabled 
                  className="w-full bg-bgSecondary border border-borderCool text-textMuted text-sm rounded-md px-3.5 py-2.5 outline-none opacity-60"
                />
              </label>
            </div>
          )}
        </div>

        {user.role === 'student' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field 
              label="LeetCode Username" 
              name="leetcodeUsername" 
              value={profileForm.leetcodeUsername} 
              onChange={(v) => setProfileForm(p => ({ ...p, leetcodeUsername: v }))} 
            />
            <Field 
              label="GitHub Profile URL" 
              name="githubUrl" 
              value={profileForm.githubUrl} 
              onChange={(v) => setProfileForm(p => ({ ...p, githubUrl: v }))} 
            />
            <Field 
              label="LinkedIn Profile URL" 
              name="linkedinUrl" 
              value={profileForm.linkedinUrl} 
              onChange={(v) => setProfileForm(p => ({ ...p, linkedinUrl: v }))} 
            />
          </div>
        )}

        {user.role === 'student' && (
          <>
            {/* Academic Details */}
            <div className="pt-4 border-t border-borderCool/60">
              <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <GraduationCap size={15} className="text-primary" /> Academic Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Field 
                  label="Degree" 
                  name="degree" 
                  value={profileForm.degree} 
                  onChange={(v) => setProfileForm(p => ({ ...p, degree: v }))} 
                />
                <Field 
                  label="Stream / Branch" 
                  name="stream" 
                  value={profileForm.stream} 
                  onChange={(v) => setProfileForm(p => ({ ...p, stream: v }))} 
                />
                <Field 
                  label="Year of Passing" 
                  name="passingYear" 
                  value={profileForm.passingYear} 
                  onChange={(v) => setProfileForm(p => ({ ...p, passingYear: v }))} 
                />
                <Field 
                  label="CGPA / Percentage" 
                  name="cgpa" 
                  value={profileForm.cgpa} 
                  onChange={(v) => setProfileForm(p => ({ ...p, cgpa: v }))} 
                />
              </div>
            </div>

            {/* Skills */}
            <div className="pt-4 border-t border-borderCool/60">
              <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Award size={15} className="text-primary" /> Skills
              </h4>
              <Field 
                label="Technical Skills (comma-separated)" 
                name="skills" 
                placeholder="React, Node.js, Python, CSS, Git" 
                value={profileForm.skills} 
                onChange={(v) => setProfileForm(p => ({ ...p, skills: v }))} 
              />
            </div>

            {/* Job Preference */}
            <div className="pt-4 border-t border-borderCool/60">
              <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Briefcase size={15} className="text-primary" /> Job Preference
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field 
                  label="Preferred Roles" 
                  name="preferredRoles" 
                  placeholder="e.g. SDE, Frontend Engineer" 
                  value={profileForm.preferredRoles} 
                  onChange={(v) => setProfileForm(p => ({ ...p, preferredRoles: v }))} 
                />
                <Field 
                  label="Preferred Locations" 
                  name="preferredLocations" 
                  placeholder="e.g. Bangalore, Remote" 
                  value={profileForm.preferredLocations} 
                  onChange={(v) => setProfileForm(p => ({ ...p, preferredLocations: v }))} 
                />
                <Field 
                  label="Expected CTC" 
                  name="expectedCtc" 
                  placeholder="e.g. 8 LPA" 
                  value={profileForm.expectedCtc} 
                  onChange={(v) => setProfileForm(p => ({ ...p, expectedCtc: v }))} 
                />
              </div>
            </div>

            {/* Other details */}
            <div className="pt-4 border-t border-borderCool/60">
              <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <BookOpen size={15} className="text-primary" /> Projects & Certifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-textMuted">Projects</span>
                  <textarea
                    name="projects"
                    placeholder="Describe your key academic or personal projects..."
                    value={profileForm.projects}
                    onChange={(e) => setProfileForm(p => ({ ...p, projects: e.target.value }))}
                    className="w-full bg-bgSecondary border border-borderCool text-textPrimary text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-primary min-h-[80px]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-textMuted">Certifications</span>
                  <textarea
                    name="certifications"
                    placeholder="List major certifications or achievements..."
                    value={profileForm.certifications}
                    onChange={(e) => setProfileForm(p => ({ ...p, certifications: e.target.value }))}
                    className="w-full bg-bgSecondary border border-borderCool text-textPrimary text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-primary min-h-[80px]"
                  />
                </label>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-textMuted">Profile Picture</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg shrink-0 overflow-hidden border-2 border-borderCool">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <label className="flex-1">
              <input 
                name="profilePicture" 
                type="file" 
                accept="image/*" 
                className="text-xs text-textSecondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-bgHover file:text-textPrimary file:font-semibold file:cursor-pointer hover:file:bg-borderCool transition-colors" 
              />
            </label>
          </div>
        </div>

        <button 
          type="submit"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm self-start mt-2"
        >
          <Save size={14} /> Save Profile Details
        </button>
      </form>

      {/* Password Reset Column */}
      <form 
        onSubmit={handlePasswordSubmit}
        className="lg:col-span-1 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-5 self-start"
      >
        <div className="pb-3 border-b border-borderCool/60">
          <SectionTitle icon={Lock} title="Security & Password" />
        </div>

        <Field 
          label="Current Password" 
          type="password" 
          placeholder="••••••••" 
          value={passwordForm.currentPassword} 
          onChange={(v) => setPasswordForm(p => ({ ...p, currentPassword: v }))} 
          required 
        />
        <Field 
          label="New Password" 
          type="password" 
          placeholder="••••••••" 
          value={passwordForm.newPassword} 
          onChange={(v) => setPasswordForm(p => ({ ...p, newPassword: v }))} 
          required 
        />
        <Field 
          label="Confirm New Password" 
          type="password" 
          placeholder="••••••••" 
          value={passwordForm.confirmPassword} 
          onChange={(v) => setPasswordForm(p => ({ ...p, confirmPassword: v }))} 
          required 
        />

        <button 
          type="submit"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm w-full mt-2"
        >
          <Key size={14} /> Update Password
        </button>
      </form>
    </div>
  );
}
