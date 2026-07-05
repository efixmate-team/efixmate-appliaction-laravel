"use client";

import React, { useState, useEffect, useRef } from "react";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Camera, Mail, Phone, User, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_TYPES } from "@/src/shared/constants/adminTypes";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    profileImage: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.profile();
      if (res.status && res.data) {
        setUser(res.data);
        setFormData({
          firstName: res.data.first_name || "",
          lastName: res.data.last_name || "",
          email: res.data.email || "",
          mobileNumber: res.data.mobile_number || "",
          profileImage: res.data.profile_image || ""
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compression logic using Canvas
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed base64
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setFormData(prev => ({ ...prev, profileImage: compressedBase64 }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        adminId: user.admin_id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        profileImage: formData.profileImage
      };

      const res = await adminAPI.updateAdmin(payload);
      if (res.status) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        const session = useAuthStore.getState().user;
        if (session?.role === "ADMIN" && res.data) {
          useAuthStore.getState().setUser({ ...session, ...res.data, role: "ADMIN" });
        }
        fetchProfile(); // Refresh
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5c6a7f]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#0f172a] ">Profile Settings</h1>
        <p className="text-[14px] text-[#53697e]">Manage your personal information and profile picture</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] p-6 flex flex-col items-center text-center shadow-sm">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#f8fafc] shadow-inner bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : `${formData.firstName?.[0] ?? ""}${formData.lastName?.[0] ?? ""}`.trim() ? (
                  <span className="text-4xl font-bold text-[#53697e] select-none " aria-hidden>
                    {`${formData.firstName?.[0] ?? ""}${formData.lastName?.[0] ?? ""}`.toUpperCase()}
                  </span>
                ) : (
                  <User className="w-14 h-14 text-[#5c6a7f]" strokeWidth={1.25} aria-hidden />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-[#0f172a] text-[#ffffff] rounded-full shadow-lg hover:bg-[#1e293b] transition-all hover:scale-110 active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold text-[#0f172a]">{formData.firstName} {formData.lastName}</h3>
              <p className="text-[13px] text-[#53697e] mt-0.5">{user?.admin_type === ADMIN_TYPES.SUPER_ADMIN ? 'Super Admin' : 'Administrator'}</p>
            </div>

            <div className="mt-6 w-full pt-6 border-t border-[#f1f5f9] space-y-3">
              <div className="flex items-center gap-3 text-[13px] text-[#475569]">
                <Mail className="w-4 h-4 text-[#5c6a7f]" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[#475569]">
                <Phone className="w-4 h-4 text-[#5c6a7f]" />
                <span>{formData.mobileNumber || "Not set"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]/50">
              <h2 className="text-[15px] font-bold text-[#0f172a]">Personal Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#53697e] uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c6a7f]" />
                    <input 
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#94a3b8] transition-all text-[14px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#53697e] uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c6a7f]" />
                    <input 
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#94a3b8] transition-all text-[14px]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#53697e] uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c6a7f]" />
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl focus:outline-none cursor-not-allowed opacity-70 text-[14px]"
                    readOnly
                  />
                </div>
                <p className="text-[11px] text-[#5c6a7f]">Email address cannot be changed for security reasons.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#53697e] uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c6a7f]" />
                  <input 
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="8319151766"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#94a3b8] transition-all text-[14px]"
                  />
                </div>
              </div>

              {message && (
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200",
                  message.type === "success" ? "bg-[#f0fdf4] text-[#15803d] border border-[#dcfce7]" : "bg-[#fef2f2] text-[#b91c1c] border border-[#fee2e2]"
                )}>
                  {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-[13px] font-medium">{message.text}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#f1f5f9] flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-[#ffffff] rounded-xl font-bold text-[14px] hover:bg-[#1e293b] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
