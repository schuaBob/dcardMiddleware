// default model
var ipCount = require('./ipCountModel')

module.exports = function (req, res, next) {
    // incoming ip
    var theIP = req.headers['x-forawarded-for'] || req.connection.remoteAddress

    ipCount.findOne({ ipv4: theIP }).exec((err, theIPCount) => {

        if (err) { return next(err) }

        let counterLeftNow = 1000
        
        if (theIPCount) {
            // if ip found in db

            let millisecondLeft = Date.now() - new Date(theIPCount.ipCounter).getTime()

            if (millisecondLeft < 3600000) {
                // if last request time is < 1hr

                if (theIPCount.ipCounter >= 1000) {
                    // if request >= 1000 times in the past 1 hour then just return
                    return res.status(429).send("Too Many Requests")
                }

                // if smaller then 1000 times, increase RequestCounter of this ip
                theIPCount.ipCounter += 1
                counterLeftNow -= theIPCount.ipCounter
                theIPCount.save()

            } else {

                // if last request time is > 1hr, renew the counter clock
                theIPCount.ipCounter = 1
                theIPCount.lastReqTime = new Date()
                counterLeftNow -= theIPCount.ipCounter
                theIPCount.save()

            }

            // modify the response
            res.append('X-RateLimit-Remaining', counterLeftNow.toString())
            res.append('X-RateLimit-Reset', `${(3600000 - millisecondLeft) / 1000}`)
            // X-RateLimit-Reset is response in the second format
            next()

        } else {

            // if ip not found in db
            var temp = new ipCount({ ipv4: theIP })
            temp.save((err, newIPCount) => {
                if (err) {
                    return next(err)
                } else {
                    
                    // modify the response
                    counterLeftNow-=newIPCount.ipCounter
                    res.append('X-RateLimit-Remaining', counterLeftNow.toString())
                    var millisecondLeft = Date.now() - new Date(theIPCount.ipCounter).getTime()
                    res.append('X-RateLimit-Reset', `${(3600000 - millisecondLeft) / 1000}`)

                    next()
                }
            })
        }

    })
}