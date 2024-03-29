import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import ApiResponse from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user data from the frontend
    const { email, password } = req.body

    // do validation checks - not empty
    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: email
    const existingUser = await User.findOne({
        $or: [{ email }]
    })
    if (existingUser)
        throw new ApiError(409, "User with email already exists")

    // create user object - create entry in db
    const user = await User.create({
        email: email.toLowerCase(),
        password
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation
    if (!createdUser)
        throw new ApiError(500, "Error creating user in the database")

    // return the response to user
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // take the email and password from user
    const { email, password } = req.body
    if (!email || !password)
        throw new ApiError(400, "Email and password are required")
    // check if user exists
    const user = await User.findOne({ email })
    if (!user)
        throw new ApiError(404, "User with email does not exist")
    // if user exists then check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect)
        throw new ApiError(401, "Password is incorrect")
    // if password is correct then generate tokens and send it to user else send error
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }
                , "User logged in successfully")
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    )
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken)
        throw new ApiError(401, "Error: Did not receive refresh token")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user)
            throw new ApiError(401, "Invalid Refresh Token")
        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError(401, "Refresh token is expired or used")

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {
                    accessToken, refreshToken
                }, "Access token refreshed successfully")
            )

    } catch (error) {
        new ApiError(400, error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword)
        throw new ApiError(400, "Old and new password are required")

    const user = await User.findById(req.user?._id)
    if (!user)
        throw new ApiError(404, "User not found")

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect)
        throw new ApiError(401, "Old password is incorrect")

    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User found"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
}