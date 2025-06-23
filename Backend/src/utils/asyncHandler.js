//Since while handling data every time we need to wrap them in async-await and try-catch which is very time consuming
//to optimise we make a wrapper and reuse it everywhere

export {asyncHandler} //a higher order function which receives a function as a parameter or return them as a variable

//We are making a wrapper as try catch
// const asyncHandler = (func) => async (req, res, next) => {//function is getting passed as a parameter and we are taking req,res,next properties of the function
//     try{
//         await func(req, res, next);
//     }
//     catch (error){
//         res.status(error.code || 500).json({success: false, message: error.message})
//     }
// } 


//or we can do through promises


const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler()).catch((err) => next(err))
    }
}