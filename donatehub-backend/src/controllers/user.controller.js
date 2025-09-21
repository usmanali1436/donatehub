import { User } from "../models/user.model.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import asnycHandler from "../util/asnycHandler.js";

const generateAccessAndRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(
                500,
                "Error while generating access token and refresh token"
            );
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new ApiError(
            500,
            "Error while generating access token and refresh token"
        );
    }
};

const registerUser = asnycHandler(async (req, res) => {
    const { username, email, fullName, password, role } = req.body;
    if (
        [username, email, fullName, password].some(
            (value) => value?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (role && !["ngo", "donor"].includes(role)) {
        throw new ApiError(400, "Invalid role. Role must be either 'ngo' or 'donor'");
    }

    const isExistUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (isExistUser) {
        throw new ApiError(400, "User with the email or username already exist.");
    }

    const userCreated = await User.create({
        username,
        email,
        password,
        fullName,
        role: role || "donor",
    });

    if (!userCreated) {
        throw new ApiError(500, "User cann't registered successfully");
    }

    const user = await User.findById(userCreated._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(500, "User cann't registered successfully");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                user,
                "User details has been registered successfully."
            )
        );
});

const loginUser = asnycHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }
    if (!password) {
        throw new ApiError("Password is required.");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(400, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User has been logged in successfully."
            )
        );
});

const changeUserPassword = asnycHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (
        [oldPassword, newPassword, confirmPassword].some(
            (value) => value?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "Confirm Password not matched");
    }

    const user = await User.findById(req?.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect current password");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password has been changed successfully.")
        );
});

const updateUser = asnycHandler(async (req, res) => {
    const { fullName } = req.body;

    if (!fullName) {
        throw new ApiError("Fullname is required.");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullName },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(400, "User data could not updated successfully.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User has been updated successfully.")
        );
});
const logoutUser = asnycHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set: { refreshToken: undefined },
        },
        {
            new: true,
        }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logout successfully."));
});

const getCurrentUser = asnycHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req?.user, "User fetched successfully."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    updateUser,
    getCurrentUser,
    changeUserPassword,
};
