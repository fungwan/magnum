/**
 * Created by fengyun on 2015/4/17.
 */
var logon = require('../modules/web_logon');

module.exports = function(app) {
//    app.get('/plc_screen', function (req, res) {
//        var name = req.query.conferenceName;
//        res.render('index',{title:name});
//    });

    app.get('/', function (req, res) {
        logon.web_logon(req,res);
    });
};
