import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Edit2, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const CompaniesTable = () => {
  const { companies, searchCompanyByText } = useSelector((store) => store.company);
  const [filterCompany, setFilterCompany] = useState(companies);
  const navigate = useNavigate();

  useEffect(() => {
    const filteredCompany =
      companies.length >= 0 &&
      companies.filter((company) => {
        if (!searchCompanyByText) return true;
        return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());
      });
    setFilterCompany(filteredCompany);
  }, [companies, searchCompanyByText]);

  return (
    <div className="bg-gradient-to-br from-[#F4F0FF] via-[#F9F9FF] to-white py-10 px-6 rounded-2xl shadow-md">


      <Table>
        <TableCaption className="text-sm text-gray-500">
          A list of your recently registered companies
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-[#E9E3FF] text-[#3A2175] rounded-md">
            <TableHead className="text-[#3A2175]">Logo</TableHead>
            <TableHead className="text-[#3A2175]">Name</TableHead>
            <TableHead className="text-[#3A2175]">Website</TableHead>
            <TableHead className="text-[#3A2175]">Date</TableHead>
            <TableHead className="text-right text-[#3A2175]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterCompany?.map((company, index) => (
            <TableRow
              key={company._id}
              className={`${
                index % 2 === 0 ? 'bg-white' : 'bg-[#F5F0FF]'
              } transition hover:bg-[#EEE8FF]`}
            >
              <TableCell className="rounded-l-md">
                <Avatar>
                  <AvatarImage
                    src={
                      company.logo &&
                      company.logo !==
                        'https://res.cloudinary.com/dqgvjqjqj/image/upload/v1710000000/default-company-logo.png'
                        ? company.logo
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-[#6A38C2] text-white font-medium">
                    {company.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>

              <TableCell className="font-medium text-[#3A2175]">{company.name}</TableCell>

              <TableCell className="text-sm text-blue-600 hover:underline max-w-[180px] truncate">
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  {company.website}
                </a>
              </TableCell>

              <TableCell className="text-sm text-gray-600">
                {company.createdAt?.split('T')[0]}
              </TableCell>

              <TableCell className="text-right rounded-r-md">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                      <MoreHorizontal className="text-gray-600" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-32">
                    <div
                      onClick={() => navigate(`/admin/companies/${company._id}`)}
                      className="flex items-center gap-2 w-fit cursor-pointer text-sm text-[#4B2993] hover:text-[#3A2175]"
                    >
                      <Edit2 className="w-4" />
                      <span>Edit</span>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompaniesTable;
