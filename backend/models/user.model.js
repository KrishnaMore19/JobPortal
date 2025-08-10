import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:['student','recruiter'],
        required:true
    },
    profile:{
        bio: { type: String },
        skills: [{ type: String }],
        resume: { type: Buffer }, // ✅ Binary resume
        resumeOriginalName: { type: String },
        resumeMimeType: { type: String }, // ✅ Added for content-type
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, 
        profilePhoto: {
            type: String,
            default: "https://res.cloudinary.com/dqgvjqjqj/image/upload/v1710000000/default-profile-photo.png"
        }
    },
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }]
},{timestamps:true});

export const User = mongoose.model('User', userSchema);
