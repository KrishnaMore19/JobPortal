import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './shared/Navbar';
import { Button } from './ui/button';
import { ArrowLeft, Globe, MapPin, Mail, Phone } from 'lucide-react';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await axios.get(`${COMPANY_API_END_POINT}/get/${id}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setCompany(response.data.company);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        toast.error('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F0FF] via-[#F9F9FF] to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F0FF] via-[#F9F9FF] to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Company not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F0FF] via-[#F9F9FF] to-white transition-colors duration-300">
      <Navbar />

      {/* Hero-style Header */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 shadow-md">
            {company.logo && company.logo !== 'https://res.cloudinary.com/dqgvjqjqj/image/upload/v1710000000/default-company-logo.png' ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#6A38C2] text-white text-3xl font-bold">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3A2175]">{company.name}</h1>
            <p className="text-muted-foreground mt-2">{company.description}</p>
          </div>
        </div>
      </section>

      {/* Company Details */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <a
                href={
                  company.website?.trim().startsWith('http')
                    ? company.website.trim()
                    : `https://${company.website?.trim()}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website?.trim() || 'No website provided'}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{company.location || 'No location provided'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Information</h3>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{company.contact?.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{company.contact?.phone || 'No phone provided'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
