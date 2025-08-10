import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, Eye, MoreHorizontal } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const AdminJobsTable = () => {
  const { allAdminJobs, searchJobByText } = useSelector((store) => store.job)
  const [filterJobs, setFilterJobs] = useState(allAdminJobs)
  const navigate = useNavigate()

  useEffect(() => {
    const filteredJobs = allAdminJobs.filter((job) => {
      if (!searchJobByText) return true
      return (
        job?.title?.toLowerCase().includes(searchJobByText.toLowerCase()) ||
        job?.company?.name.toLowerCase().includes(searchJobByText.toLowerCase())
      )
    })
    setFilterJobs(filteredJobs)
  }, [allAdminJobs, searchJobByText])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <Table>
        <TableCaption className="text-sm text-gray-500 px-4 py-2">
          A list of your recently posted jobs
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-[#F4F0FF] text-[#4B2993]">
            <TableHead className="text-[#4B2993] font-semibold">Company Name</TableHead>
            <TableHead className="text-[#4B2993] font-semibold">Role</TableHead>
            <TableHead className="text-[#4B2993] font-semibold">Date</TableHead>
            <TableHead className="text-right text-[#4B2993] font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterJobs?.map((job, index) => (
            <TableRow
              key={job._id}
              className={`${
                index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7FF]'
              } hover:bg-[#F3EDFF] transition`}
            >
              <TableCell className="text-gray-800">{job?.company?.name}</TableCell>
              <TableCell className="text-gray-800">{job?.title}</TableCell>
              <TableCell className="text-gray-600">{job?.createdAt?.split('T')[0]}</TableCell>
              <TableCell className="text-right">
                <Popover>
                  <PopoverTrigger>
                    <div className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                      <MoreHorizontal className="text-gray-600" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-32">
                    <div
                      onClick={() => navigate(`/admin/companies/${job._id}`)}
                      className="flex items-center gap-2 cursor-pointer text-sm text-[#4B2993] hover:text-[#3A2175]"
                    >
                      <Edit2 className="w-4" />
                      <span>Edit</span>
                    </div>
                    <div
                      onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                      className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-[#4B2993] hover:text-[#3A2175]"
                    >
                      <Eye className="w-4" />
                      <span>Applicants</span>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminJobsTable
