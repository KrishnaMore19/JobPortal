import React from 'react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'

const LatestJobCards = ({job}) => {
    const navigate = useNavigate();
    return (
        <div 
            onClick={()=> navigate(`/description/${job._id}`)} 
            className='p-5 rounded-lg shadow-sm bg-white border border-gray-100 cursor-pointer hover:border-[#4F46E5] hover:shadow-md transition-all duration-200'
        >
            <div>
                <h1 className='font-medium text-lg text-[#4F46E5]'>{job?.company?.name}</h1>
                <p className='text-sm text-gray-500'>{job?.location || 'India'}</p>
            </div>
            <div>
                <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
                <p className='text-sm text-gray-600 line-clamp-2'>{job?.description}</p>
            </div>
            <div className='flex items-center gap-2 mt-4'>
                <Badge className={'text-blue-700 font-medium'} variant="ghost">{job?.position} Positions</Badge>
                <Badge className={'text-[#4F46E5] font-medium'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-emerald-600 font-medium'} variant="ghost">{job?.salary}LPA</Badge>
            </div>
        </div>
    )
}

export default LatestJobCards