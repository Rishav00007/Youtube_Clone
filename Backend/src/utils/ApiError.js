class ApiError extends Error{ //an api error class given by node js
    constructor(
        statusCode,
        message= "Something went wrong", //no use
        errors= [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors
        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor) //passing instance of stack in stackTrace if present
        }
    }

}

export {ApiError}

//For any error it must went through ApiError, so to ensure that we need to apply some checkings or middlewares in between