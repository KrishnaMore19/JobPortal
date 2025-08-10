import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setSingleCompany } from '@/redux/companySlice'

const CompanyCreate = () => {
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState("")
  const dispatch = useDispatch()

  const registerNewCompany = async () => {
    if (!companyName?.trim()) {
      toast.error("Company name is required.")
      return
    }

    try {
      const res = await axios.post(
        `${COMPANY_API_END_POINT}/register`,
        { companyName },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      )

      if (res?.data?.success) {
        dispatch(setSingleCompany(res.data.company))
        toast.success(res.data.message)
        const companyId = res?.data?.company?._id
        navigate(`/admin/companies/${companyId}`)
      }
    } catch (error) {
      console.log(error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--section-hero))]">

  <Navbar />
  <div className="max-w-4xl mx-auto py-20 px-6 text-center">
    <div className="mb-10">
      <h1 className="text-4xl font-bold text-[#3A2175]">Let's Get Your Company Started</h1>
      <p className="text-gray-600 mt-2 text-lg">
        What would you like to name your company? Don’t worry — you can change this later.
      </p>
    </div>

    <div className="text-left max-w-xl mx-auto">
      <Label className="text-base">Company Name</Label>
      <Input
        type="text"
        className="my-3"
        placeholder="JobHunt, Microsoft, TechNova..."
        onChange={(e) => setCompanyName(e.target.value)}
      />

      <div className="flex items-center justify-center gap-4 mt-10">
        <Button
          variant="outline"
          className="px-6 border-[#B19CE3] text-[#4B2993]"
          onClick={() => navigate("/admin/companies")}
        >
          Cancel
        </Button>
        <Button className="px-6 bg-[#6A38C2] hover:bg-[#5A2FA5]" onClick={registerNewCompany}>
          Continue
        </Button>
      </div>
    </div>
  </div>
</div>

  )
}

export default CompanyCreate
