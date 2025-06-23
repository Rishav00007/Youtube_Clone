//unlike errors since response get generated in express and it did not have any class for response, so we need to create our own class
//and we always send respond to any user through this file

class ApiResponse{
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400 //Server has ranges of serverCode in HTTP for different responses and below 400 no error we face
        
    }
}