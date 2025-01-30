module.exports={
    mailOtp: (otp)=>{
        let templete=`<!DOCTYPE html>
        <html>
        <head>
            <title>Secure OTP for Your Account</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    color: #0275d8;
                }
                .otp {
                    font-size: 24px;
                    color: #ffffff;
                    background-color: #5cb85c;
                    padding: 10px 20px;
                    border-radius: 4px;
                    display: inline-block;
                    margin: 20px 0;
                }
                p {
                    color: #666;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Your One-Time Password (OTP)</h2>
                <p>Hello,</p>
                <p>You requested a one-time password for your account. Please use the following OTP to proceed:</p>
                <div class="otp">${otp}</div>
                <p>This OTP is valid for 10 minutes. Please do not share this with anyone.</p>
                <p>If you did not request this, please contact our support team immediately.</p>
                <div class="footer">
                    <p>Thank you for choosing <strong>Syscon pvt Ltd</strong></p>
                    <p>Contact us at support@example.com for any assistance</p>
                </div>
            </div>
        </body>
        </html>
        `
        return templete
    }
}