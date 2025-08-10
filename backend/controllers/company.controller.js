import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }
        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            })
        };
        company = await Company.create({
            name: companyName,
            userId: req.id,
            logo: "https://res.cloudinary.com/dqgvjqjqj/image/upload/v1710000000/default-company-logo.png" // Default company logo
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id
        const companies = await Company.find({ userId });
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        return res.status(200).json({
            companies,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId).populate('userId', 'fullname email phoneNumber');
        
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }

        // Return company data without sensitive information
        const companyData = {
            _id: company._id,
            name: company.name,
            description: company.description,
            website: company.website,
            location: company.location,
            logo: company.logo,
            createdAt: company.createdAt,
            contact: {
                name: company.userId?.fullname,
                email: company.userId?.email,
                phone: company.userId?.phoneNumber
            }
        };

        return res.status(200).json({
            company: companyData,
            success: true
        });
    } catch (error) {
        console.error("Error fetching company:", error);
        return res.status(500).json({
            message: "Failed to fetch company information",
            success: false
        });
    }
}
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
        let updateData = { name, description, website, location };
 
        // Only process file if it exists
        if (req.file) {
            const fileUri = getDataUri(req.file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            updateData.logo = cloudResponse.secure_url;
        }
    
        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        return res.status(200).json({
            message: "Company information updated.",
            company,
            success: true
        });

    } catch (error) {
        console.error("Error updating company:", error);
        return res.status(500).json({
            message: "Failed to update company information. Please try again.",
            success: false
        });
    }
}