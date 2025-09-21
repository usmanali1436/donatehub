import ApiError from "../util/ApiError.js";
import asnycHandler from "../util/asnycHandler.js";

const checkRole = (...allowedRoles) => {
    return asnycHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            throw new ApiError(403, `Access denied. Required role: ${allowedRoles.join(" or ")}`);
        }

        next();
    });
};

const checkNGO = checkRole("ngo");
const checkDonor = checkRole("donor");
const checkNGOOrDonor = checkRole("ngo", "donor");

export {
    checkRole,
    checkNGO,
    checkDonor,
    checkNGOOrDonor
};