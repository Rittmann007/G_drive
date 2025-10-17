const jwt = require("jsonwebtoken")

function auth(req,res,next) {
    const token = req.cookies.token        // take the token from cookie

    if (!token) {
        return res.status(401).json({
            message: "unauthorized"
        })
    } else {
        try {
            const decoded = jwt.verify(token,process.env.JWT_SECRET) // decode the cookie
    
            req.user = decoded       // set the decoded cookie in req.user
    
            return next()
            
        } catch (error) {
             return res.status(401).json({
            message: "unauthorized"
        })
        }
    }
}

module.exports = auth