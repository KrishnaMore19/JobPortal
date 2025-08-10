import React, { useEffect } from 'react'
import Navbar from '../shared/Navbar'
import ApplicantsTable from './ApplicantsTable'
import axios from 'axios'
import { APPLICATION_API_END_POINT } from '@/utils/constant'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAllApplicants } from '@/redux/applicationSlice'

const Applicants = () => {
  const params = useParams()
  const dispatch = useDispatch()
  const { applicants } = useSelector((store) => store.application)

  useEffect(() => {
    const fetchAllApplicants = async () => {
      try {
        const res = await axios.get(
          `${APPLICATION_API_END_POINT}/${params.id}/applicants`,
          { withCredentials: true }
        )
        dispatch(setAllApplicants(res.data.job))
      } catch (error) {
        console.log(error)
      }
    }
    fetchAllApplicants()
  }, [])

  return (
    <div className="min-h-screen bg-[hsl(var(--section-hero))]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="font-bold text-2xl text-gray-800 mb-4">
            Applicants ({applicants?.applications?.length || 0})
          </h1>
          <ApplicantsTable />
        </div>
      </div>
    </div>
  )
}

export default Applicants
