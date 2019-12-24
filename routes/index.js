var express = require('express');
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var queryString = require('query-string');
var url = require('url');
//var popupS = require('popups');


var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '',
  database : 'keyastock'
});
connection.connect(function(err){
  if(!err){
    console.log('DB Connected');
  }else{
    console.log('DB Not Connected');
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query('select * from products',function(err,db_rows){
    if(err) throw err;
    //console.log(db_rows.length);
    connection.query('select sum(quantity) as total from stock',function(err,result){
      if(err) throw err;
      //console.log(result[0].total);
      connection.query('select * from uom',function(err,unit){
        if(err) throw err;
       // console.log(unit.length);
        res.render('index', {path: '/', db_rows_array:db_rows.length, result:result[0].total, unit:unit.length});
      })
    })
  })
});

router.get('/stockin', function(req, res, next) {
  connection.query('select * from products',function(err,db_rows){
    if(err) throw err;
  connection.query('select * from uom',function(err,rows){
    if(err) throw err;
  res.render('stockin', {path: '/stockin', db_rows_array:db_rows, arrays:rows});
  })
})
});

router.post('/addstock', function(req, res, next){
  const mydata = {
    productname : req.body.productname,
    uom : req.body.uom,
    quantity : req.body.quantity
  }
  var productname = mydata.productname;
  var uom = mydata.uom;
  var quantity =  mydata.quantity;
  connection.query('select * from stock where productname = ?',[productname],function(err,result){
    if(err) throw err;
    if(result.length > 0){
      // console.log(result.quantity);
      // console.log(quantity);
      
      var newstock = parseInt(result[0].quantity) + parseInt(quantity);
      connection.query('update stock set quantity = ?, uom = ? where sid = ?',[newstock,uom,result[0].sid],function(err,respond){
        if(err) throw err;
      //console.log(parseInt(newstock));
        res.redirect('/stockin');
      })
    }else{
      connection.query("select * from stock", function(err,id){
        if(err) throw err;
        for(var i=0; i<id.length; i++){
          do{
            var sid = Math.floor(Math.random()*(999-100+1)+100);  
          }while(sid == id[i].sid)
        }
      connection.query("select pid from products where productname = ?",productname,function(err,proid){
        if(err) throw err;
        connection.query("select uid from uom where uom = ?",uom,function(err,uomid){
          if(err) throw err;
          connection.query("insert into stock set sid = ?, pid = ?, uid = ?, productname = ?, uom = ?, quantity = ?",[sid,proid[0].pid,uomid[0].uid,productname,uom,quantity],function(err,respond){
            if(err) throw err;
            res.redirect('/stockin');
          })
        })
      })
    })
  }
})
});

router.get('/stockout', function(req, res, next) {
  connection.query('select * from products',function(err,db_rows){
    if(err) throw err;
  connection.query('select * from uom',function(err,rows){
    if(err) throw err;
  res.render('stockout', {path: '/stockout', db_rows_array:db_rows, arrays:rows});
  })
})
});

router.post('/outstock', function(req, res, next){
  const mydata = {
    productname : req.body.productname,
    uom : req.body.uom,
    quantity : req.body.quantity
  }
  var productname = mydata.productname;
  var uom = mydata.uom;
  var quantity =  mydata.quantity;
  connection.query('select quantity from stock where productname = ?',[productname],function(err,result){
    if(err) throw err;
    if(result.length > 0 && result[0].quantity >= quantity){
      // console.log(result.quantity);
      // console.log(quantity);
      
      var newstock = parseInt(result[0].quantity) - parseInt(quantity);
      connection.query('update stock set quantity = ?, uom = ? where productname = ?',[newstock,uom,productname],function(err,respond){
        if(err) throw err;
      //console.log(parseInt(newstock));
        res.redirect('/stockout');
      })
    }else{
      // connection.query('insert into stock set ?',mydata,function(err,result) {
      //   if(err) throw err;
        res.redirect('/customerror');
      //})
    }
  })
});

router.get('/stock', function(req, res, next) {
  connection.query('select * from stock',function(err,db_rows){
    if(err) throw err;
  res.render('stock', {path: '/stock', db_rows_array:db_rows, result:0});
  })
});

router.get('/customerror', function(req, res, next) {
    res.render('customerror', {path: '/customerror'});
});


router.get('/addproduct', function(req, res, next) {
  connection.query("select * from products",function(err,db_rows){
    if(err) throw err;
    connection.query("select * from uom",function(err,result){
      if(err) throw err;
    res.render('addproduct', {path:'/addproduct', array:db_rows, db_rows_array:result});
  //res.render('addproduct', {path: '/addproduct'});
})
  })
});

router.post('/addproduct', function(req, res, next) {
  const mybodydata = {
    productname : req.body.productname
  }
  var pro = mybodydata.productname;
  
  connection.query("select * from products", function(err,id){
    if(err) throw err;
    for(var i=0; i<id.length; i++){
      do{
        var pid = Math.floor(Math.random()*(999-100+1)+100);  
      }while(pid == id[i].pid)
    }
    connection.query("select productname from products where productname = ? ",[pro], function(err,result){
      if(err) throw err;
      if(result.length > 0){
        res.render('customerror');
      }else{
        //console.log("no");
        connection.query("insert into products set pid = ?, productname = ?",[pid,pro], function(err,result){
          if(err) {throw err;}else{res.redirect('addproduct');}
        })
      }
    })
  })
});

router.get('/editproduct/:id', function(req, res, next){
 
  var editid = req.params.id;
  //console.log(url.parse('/editproduct/:id').pathname);
  console.log("Editid is "+ editid);
  connection.query("select * from products where pid = ? ",[editid],function(err,db_rows){
    if(err) throw err;
    //console.log(db_rows);
    res.render('editproduct', {path:'/editproduct', db_rows_array:db_rows});
  })
});

router.post('/editproduct/:id', function(req, res, next){
  var id = req.params.id;
  console.log("Edit ID is "+ id);
  var productname = req.body.productname;
  var pid = req.body.pid;
  // connection.query("select productname from products where productname = ?",[productname],function(err,result){
  //   if(err) throw err;
  //   if(result.length > 0){
  //     res.redirect('customerror');
  //   }else{
  connection.query("update products set pid = ?, productname = ? where pid = ?  ",[pid,productname,pid], function(err,respond){
    if(err) {throw err;}else{
    res.redirect('/');}
  })
//}
//})
});

router.get('/deleteproduct/:id', function(req, res){
  var deleteid = req.params.id;
  //console.log("Deleted id is "+ deleteid);
  connection.query("delete from products where pid = ? ",[deleteid],function(err,db_rows){
    if(err) throw err;
    //console.log(db_rows);
    //console.log("Record Deleted");
    res.redirect('/addproduct');
  })
});

//UOM

router.get('/adduom', function(req, res, next) {
  connection.query("select * from uom",function(err,db_rows){
    if(err) throw err;
    res.render('addproduct', {path:'/addproduct', db_rows_array:db_rows});
  //res.render('addproduct', {path: '/addproduct'});
})
});

router.post('/adduom', function(req, res, next) {
  const mybodydata = {
    uom : req.body.uom
  }
  var pro = mybodydata.uom;
  
  connection.query("select * from uom", function(err,id){
    if(err) throw err;
    for(var i=0; i<id.length; i++){
      do{
        var uid = Math.floor(Math.random()*(999-100+1)+100);  
      }while(uid == id[i].uid)
    }
    connection.query("select uom from uom where uom = ? ",[pro], function(err,result){
      if(err) throw err;
      if(result.length > 0){
        res.render('customerror');
      }else{
        //console.log("no");
        connection.query("insert into uom set uid = ?, uom = ?",[uid,pro], function(err,result){
          if(err) {throw err;}else{res.redirect('addproduct');}
        })
      }
    })
  })
});

router.get('/edituom/:id', function(req, res, next){
  var editid = req.params.id;
  //console.log("Editid is "+ editid);
  connection.query("select * from uom where uid = ? ",[editid],function(err,db_rows){
    if(err) throw err;
    //console.log(db_rows);
    res.render('edituom', {path:'/edituom', db_rows_array:db_rows});
  })
});

router.post('/edituom/:id', function(req,res){
  var id = req.params.id;
  //console.log("Edit ID is "+ id);
  var uom = req.body.uom;
  var uid = req.body.uid;
  connection.query("select uom from uom where uom = ?",[uom],function(err,result){
    if(err) throw err;
    if(result.length > 0){
      res.render('customerror');
    }else{
  connection.query("update uom set uid = ?, uom = ? where uid = ?  ",[uid,uom,id],function(err,respond){
    if(err) throw err;
    res.redirect('/addproduct');
  });
}
});
});

router.get('/deleteuom/:id', function(req, res){
  var deleteid = req.params.id;
  //console.log("Deleted id is "+ deleteid);
  connection.query("delete from uom where uid = ? ",[deleteid],function(err,db_rows){
    if(err) throw err;
    //console.log(db_rows);
    //console.log("Record Deleted");
    res.redirect('/addproduct');
  })
});

router.post('/search', function(req, res, next){
  var searchid = req.body.searchid;
  connection.query("SELECT * FROM stock WHERE productname LIKE ?", searchid + '%',function(err,ser){
    if(err) throw err;
    //console.log(ser);
    res.render('searchproduct', {path : '/searchproduct', result:ser});
  })
});

router.get('/setzero/:id', function(req, res){
  var sid = req.params.id;
  connection.query('update stock set quantity = 0 where sid = ?',[sid],function(err,result){
    if(err) {throw err;}else{
    res.redirect('/stock');}
  })
});

router.get('/test', function(req, res, next) {
  res.render('test');
});

module.exports = router;
