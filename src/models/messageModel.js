function handleMessage(code) {
    let message = "";
  
    switch (code) {
      case 403:
        message = "Duplicate Field Name Found....!";
        break;

        case 200:
        message = "Data Inserted Successfully";
        break;

        case 500:
        message = "Something went wrong...";
        break;
       
      // Add more cases for other status codes if needed
  
      default:
        message = "Unknown Error";
    }
  
    return message;
  }
  
  // Example usage:
  // const statusCode = 403;
  // const errorMessage = handleMessage(statusCode);
  
  // return res.status(statusCode).send({
  //   success: false,
  //   message: errorMessage,
  // });
  