import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useSelector } from 'react-redux'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const PostJob = () => {
  const [input, setInput] = useState({
    title: '',
    description: '',
    requirements: '',
    salary: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    position: 0,
    companyId: '',
  })
  const [loading, setLoading] = useState(false)
  const [selectedCompanyName, setSelectedCompanyName] = useState('')
  const navigate = useNavigate()

  const { companies } = useSelector((store) => store.company)

  const changeEventHandler = (e) => {
    const newValue = e.target.value
    setInput((prev) => ({ ...prev, [e.target.name]: newValue }))
  }

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (company) => company.name.toLowerCase() === value.toLowerCase()
    )
    if (selectedCompany) {
      setSelectedCompanyName(selectedCompany.name)
      setInput((prev) => ({ ...prev, companyId: selectedCompany._id }))
    }
  }

  const validateForm = () => {
    if (!input.title) return toast.error('Please enter a job title')
    if (!input.description) return toast.error('Please enter a job description')
    if (!input.requirements) return toast.error('Please enter job requirements')
    if (!input.salary) return toast.error('Please enter a salary range')
    if (!input.location) return toast.error('Please enter a job location')
    if (!input.jobType) return toast.error('Please enter a job type')
    if (
      !input.experienceLevel ||
      isNaN(input.experienceLevel) ||
      Number(input.experienceLevel) < 0
    )
      return toast.error('Please enter a valid experience level (in years)')
    if (!input.position || input.position < 1)
      return toast.error('Please enter a valid number of positions')
    if (!input.companyId) return toast.error('Please select a company')

    return true
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      const formData = {
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        salary: Number(input.salary) || 0,
        location: input.location,
        jobType: input.jobType,
        experienceLevel: Number(input.experienceLevel) || 0,
        position: Number(input.position) || 1,
        companyId: input.companyId,
      }

      const res = await axios.post(`${JOB_API_END_POINT}/post`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })

      if (res.data.success) {
        toast.success(res.data.message)
        navigate('/admin/jobs')
      } else {
        toast.error(res.data.message || 'Failed to create job')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create job.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--section-hero))]">

      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form
          onSubmit={submitHandler}
          className="bg-white p-8 border border-gray-200 shadow-sm rounded-lg"
        >
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Post a New Job
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Fields */}
            <div>
              <Label>Title</Label>
              <Input
                name="title"
                value={input.title}
                onChange={changeEventHandler}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                placeholder="Brief job description"
                required
              />
            </div>
            <div>
              <Label>Requirements</Label>
              <Input
                name="requirements"
                value={input.requirements}
                onChange={changeEventHandler}
                placeholder="Required skills and qualifications"
                required
              />
            </div>
            <div>
              <Label>Salary</Label>
              <Input
                name="salary"
                value={input.salary}
                onChange={changeEventHandler}
                placeholder="e.g. 50,000 - 70,000"
                required
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                name="location"
                value={input.location}
                onChange={changeEventHandler}
                placeholder="Job location"
                required
              />
            </div>
            <div>
              <Label>Job Type</Label>
              <Input
                name="jobType"
                value={input.jobType}
                onChange={changeEventHandler}
                placeholder="e.g. Full-time, Part-time"
                required
              />
            </div>
            <div>
              <Label>Experience Level (in years)</Label>
              <Input
                type="number"
                name="experienceLevel"
                value={input.experienceLevel}
                onChange={changeEventHandler}
                placeholder="e.g. 2"
                min="0"
                step="0.5"
                required
              />
            </div>
            <div>
              <Label>Number of Positions</Label>
              <Input
                type="number"
                name="position"
                value={input.position}
                onChange={changeEventHandler}
                min="1"
                required
              />
            </div>
            <div>
              <Label>Company</Label>
              {companies.length > 0 ? (
                <Select onValueChange={selectChangeHandler} required>
                  <SelectTrigger className="w-full my-1">
                    <SelectValue placeholder="Select a Company">
                      {selectedCompanyName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((company) => (
                        <SelectItem
                          key={company._id}
                          value={
                            company.name?.toLowerCase() || company._id
                          }
                        >
                          {company.name || 'Unnamed Company'}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-red-600 mt-1">
                  *Please register a company first
                </p>
              )}
            </div>
          </div>
          <div className="mt-6">
            {loading ? (
              <Button className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full bg-[#6A38C2] hover:bg-[#5b30a6]"
                disabled={companies.length === 0}
              >
                Post New Job
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostJob
