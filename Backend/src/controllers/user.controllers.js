import { asyncHandler } from "../utils/asyncHandler.js"; //it is a higher order function to wrap the given function into try catch and async await

const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({ //200 is http status code here
        message: "Chai aur code"
    })
});

export { registerUser }