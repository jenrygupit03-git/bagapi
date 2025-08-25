const http = require('http');
const mysql = require('mysql2');
const url = require('url');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bagdb'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const parsedUrl = url.parse(req.url, true);
  let path = parsedUrl.pathname.replace(/\/+$/, ""); 
  const query = parsedUrl.query;
  const method = req.method;


  const pathParts = path.split('/').filter(Boolean); 
  const resource = `/${pathParts[0] || ''}`; 
  const id = pathParts[1] || query.id; 

  
  if (resource === '/bags' && method === 'GET') {
    if (id) {
      db.query('SELECT * FROM bags WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        res.end(JSON.stringify(result[0] || {}));
      });
    } else {
      db.query('SELECT * FROM bags', (err, result) => {
        if (err) throw err;
        res.end(JSON.stringify(result));
      });
    }
  }

 
  else if (resource === '/bags' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { bag_name, bag_brand, price, description } = JSON.parse(body);
      db.query(
        'INSERT INTO bags (bag_name, bag_brand, price, description) VALUES (?, ?, ?, ?)',
        [bag_name, bag_brand, price, description],
        (err, result) => {
          if (err) throw err;
          res.end(JSON.stringify({
            id: result.insertId,
            bag_name,
            bag_brand,
            price,
            description,
            created_at: new Date()
          }));
        }
      );
    });
  }

  
  else if (resource === '/bags' && method === 'PUT') {
    if (!id) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ message: 'Bag ID is required for update' }));
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { bag_name, bag_brand, price, description } = JSON.parse(body);
      db.query(
        'UPDATE bags SET bag_name=?, bag_brand=?, price=?, description=? WHERE id=?',
        [bag_name, bag_brand, price, description, id],
        (err, result) => {
          if (err) throw err;
          if (result.affectedRows === 0) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: 'Bag not found' }));
          } else {
            res.end(JSON.stringify({ message: 'Bag updated successfully' }));
          }
        }
      );
    });
  }


  else if (resource === '/bags' && method === 'DELETE') {
    if (!id) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: 'Bag ID is required for deletion' }));
    } else {
      db.query('DELETE FROM bags WHERE id=?', [id], (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
          res.statusCode = 404;
          res.end(JSON.stringify({ message: 'Bag not found' }));
        } else {
          res.end(JSON.stringify({ message: 'Bag deleted successfully' }));
        }
      });
    }
  }


  else {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});


server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
