import { ROLES_ENUM } from '../../types/generics';
import { Schema, Types } from 'mongoose';
const bcrypt = require('bcryptjs');
const user_enum = [ROLES_ENUM.ADMIN, ROLES_ENUM.CLIENT];

export const userSchema = new Schema(
    {
        fullname: String,
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone_number: {
            type: String,
            trim: true,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            trim: true,
            select: false,
            required: [true, 'Please provide a password'],
            minlength: [8, 'A password must be at least 8 characters'],
        },
        tenant_id: {
            type: String,
            required: [true, 'A user must belong to a tenant'],
        },
        role: {
            type: String,
            enum: user_enum,
            default: ROLES_ENUM.CLIENT,
        },
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    },
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
