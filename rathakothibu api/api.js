import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import 'dotenv/config';
 
const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'departments', 
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, // Default PostgreSQL port is 5432
});       
  
const db2 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'teachers',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, // Default PostgreSQL port is 5432
});    
         
const db3 = new pg.Client({ 
    user: process.env.DB_USER, 
    host: process.env.DB_HOST,
    database: 'authentication',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, // Default PostgreSQL port is 5432
}); 
 
const  db7 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST, 
    database:"students",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

const db8 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database:"zenotion_space",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

const app = express();
const port = 3000;
app.use(express.static("public"));
const upload = multer();
app.use(bodyParser.urlencoded({ extended: true,limit:'100mb' }));
app.use(bodyParser.json({limit:'100mb'}));
db.connect();
db2.connect();
db3.connect();
db7.connect();
db8.connect();


// for send the subject for each sem
app.get("/:dept",async(req,res)=>{

    try{
    var dept = req.params.dept;
    console.log(dept)
    let subs = await db.query(`select * from ${dept}`);
    
    let arr = subs.rows;
    console.log(subs);
    let subjs = [[],[],[],[],[],[],[],[]];
    let j=0;
    arr.forEach(x=>{
        let k = ['1','2','3','4','5','6','7','8'];
        for(var i =0;i<=7;i++){
            subjs[i][j] = x[k[i]];
        } 
        j++;
    })
    console.log(subjs)
    res.json(subs);
} catch (error) {
    console.error('Error fetching department data:', error);
    res.status(500).send('Internal Server Error');
}});
  
app.post("/topics", async (req, res) => {
    try {
        const department = req.body.dept;
        const semester = req.body.sem;

        // Get subjects for the given semester and department
        const subject = await db.query(`SELECT "${semester}" AS subject FROM ${department} WHERE "${semester}" IS NOT NULL`);
        const sub_list = subject.rows.map(row => row.subject);

        // Initialize an array to hold the result
        //subject and each unit topic count
        const sub_and_topiccount = [];

        // Loop through each subject and count topics in each unit
        for (let j = 0; j < sub_list.length; j++) {
            const topic_count = [];
            for (let i = 1; i <= 5; i++) {
                const unit = await db2.query(`SELECT COUNT(topic) FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, sub_list[j], i]);
                const count = parseInt(unit.rows[0].count, 10);
                topic_count.push(count);
            }
            // Push the subject and its unit counts to the result array
            sub_and_topiccount.push({ [sub_list[j]]: topic_count });
        }

        console.log(sub_and_topiccount[0]);

        // Send the result back to the client
        res.json(sub_and_topiccount);
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
});


app.post("/dept_syllabus", async (req, res) => {
    const dept = req.body.dept;
  
    try {
      // Fetch the file data from the database
      const result = await db.query(`SELECT syllabus FROM syllabus where subject is null and department=$1`,[dept]);
      if (result.rows.length === 0) {
        return res.status(404).send('Department not found');
      }
  
      const pdfBuffer = result.rows[0].syllabus;
      console.log(pdfBuffer);
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=syllabus.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      console.log(err);
      res.status(500).send('Error retrieving syllabus');
    }
  });
  
  

  app.get("/sub_syllabus", async (req, res) => {
    const dept =req.body.dept;
    const sub=req.body.sub; 
  
    try {
      // Fetch the file data from the database
  
      const result = await db.query(`SELECT * FROM syllabus WHERE department=$1 and subject=$2`, [dept,sub]);
  
      const pdf = result.rows[0].syllabus;
      res.setHeader('Content-Type', 'image/png');  
      res.send(pdf);
    }catch(err){
  console.log(err);
    }
  
  });

  app.post("/name_desc",async(req,res)=>{
    const dept=req.body.dept;
    const result= await db.query(`select "${dept}" AS dept_value from name_and_desc where "${dept}" is not null`);
    const deptname_and_desc=result.rows.map(row=>row.dept_value);
    console.log(deptname_and_desc);
    res.json(deptname_and_desc);

  })



//putting the topic in the database 
app.post("/:department/:subject/:unit", async (req, res) => {
    try{
    const { department, subject, unit } = req.params;
        const topicname =req.body.topic;
        console.log(topicname);
        
        const existingRecord = await db2.query("SELECT * FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topicname]);
        
        if (existingRecord.rows.length > 0) {
            res.send(`The topic are already available`);
        } else {
            await db2.query("INSERT INTO topics (dept_name, sub_name, unit_name, topic) VALUES ($1, $2, $3, $4)", [department, subject, unit, topicname]);
            res.send(`Topic '${topicname}' successfully added`);
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// select all topic from given details 
app.get("/:department/:subject/:unit", async (req, res) => {
    try{
    const { department, subject, unit } = req.params;
    const result = await db2.query(`SELECT topic FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, subject, unit]);
    let topics = result.rows.map(row => row.topic);
    res.send(topics);
} catch (error) {
    // Handle any errors that occur during the database query or processing
    console.error('Error fetching topics:', error);
    res.status(500).send('Internal Server Error');
}
});

// Route to upload PDF files
    app.post("/upload_pdf", async (req, res) => {
try{
        const department=req.body.dept;
        const subject=req.body.sub;
        const unit=req.body.unit;
        const topic=req.body.topic;
       const originalname=req.body.file;
       const buffer= req.body.buffer_base64;
       const document_title= req.body.doc_title; 
       const document_desc= req.body.description;
       const iconClass=req.body.path;
       console.log(iconClass);
    //    console.log(buffer);
     const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
     const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);
    await db2.query('INSERT INTO documents (topic_key,document_title,document_desc,document,name,class) VALUES ($1, $2,$3,$4,$5,$6)', [topicKey,document_title,document_desc,buffer,originalname,iconClass]);
    console.log("file upload successfully");
    res.json("file upload successfully");
} catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Internal Server Error");
} 
  });     
  
  


// Route to fetch all PDF files
app.post("/show_pdf", async (req, res) => {
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const originalname = req.body.file_n['file_name'];  
    console.log(originalname);
      // Fetch the PDF file data from the database
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    const result = await db2.query(`SELECT document FROM documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    const documents = result.rows[0]; 
    res.json(documents);
} catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});


//adding link

app.post(`/topic/link`,async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const link=req.body.body.link;
    const link_title=req.body.body.link_name;
    const link_desc=req.body.body.description;
    console.log(link,link_title,link_desc,department,subject,unit,topic)
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db2.query("INSERT INTO links (link,topic_key,link_title, link_desc) VALUES ($1, $2, $3, $4)", [link, topicKey,link_title,link_desc]);
    res.json("add successfully");
} catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});

//adding video 
app.post(`/topic/video`,async(req,res)=>{
    try{
    console.log(req.body);
    
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const video=req.body.body.link;

    function extractVideoId(videoUrl) {
        // Regular expression to match YouTube video IDs
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = videoUrl.match(regExp);
        if (match && match[2].length === 11) {
            // The video ID is the second element in the match array
            return match[2];
        } else {
            // If no match found or video ID is not 11 characters long, return null
            return null;
        }
    }
    
    var videoUrl = video;
    var videoId = extractVideoId(videoUrl);
    console.log('YouTube Video ID:', videoId);
    const video_title=req.body.body.link_name;
    const video_desc=req.body.body.description;
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db2.query("INSERT INTO videos (video, topic_key,video_title,video_desc) VALUES ($1, $2, $3, $4)", [ videoId,topicKey,video_title,video_desc]);
    res.json("add successfully");
} catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}

})

//get documents name 
app.post("/topic/doc_get",async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    const documents = await db2.query("SELECT document_title,document_desc,name,class FROM documents WHERE topic_key = $1", [topicKey]);
    const docs = documents.rows.map(row => ({
        document_title: row.document_title,
        document_desc: row.document_desc,
        name: row.name,
        class:row.class
    }));    
     res.json(docs);
     }catch(error){
        console.error('Error showing doc names:', error);
        res.status(500).json({ error: 'Internal Server Error' });
     }
})



//send the  links to  the server
app.post(`/topic/link_get`,async(req,res)=>{
    try {
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const link=await db2.query("SELECT link,link_title,link_desc FROM links WHERE topic_key =  $1",[topicKey]);
    const links = link.rows.map(row => ({
        link: row.link,
        link_title: row.link_title,
        link_desc: row.link_desc
    }));   
res.json(links);
} catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})
 
//send videos to the server

app.post(`/topic/video_get`,async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const video=await db2.query("SELECT video,video_title,video_desc FROM videos WHERE topic_key = $1",[topicKey]);   
    const videos =video.rows.map(row => ({
        video: row.video,
        video_title: row.video_title,
        video_desc: row.video_desc
    }));   
res.json(videos);
} catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})



//delete document
app.post("/delete_document", async (req, res) => {
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const originalname = req.body.file_n['file_name'];  
    console.log(originalname);

      // Fetch the PDF file data from the database
    const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 AND topic = $4", [department, subject,unit,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db2.query(`delete FROM documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    res.json("delete document successfully");
} catch (error) {
    console.error('Error delete document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}         
});

//delete topic
app.post("/delete_topic", async (req, res) => {
    try{
        const  department = req.body.dept;
        const subject = req.body.sub;
        const topicname =req.body.topic;
        const unit=req.body.unit;
        console.log(req.body);
        const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name =$3 AND topic = $4", [department, subject,unit,topicname]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);   

            console.log("topic come to delete");
            await db2.query("delete from documents where topic_key=$1", [topicKey]);
            await db2.query("delete from links where topic_key=$1", [topicKey]);
            await db2.query("delete from videos where topic_key=$1", [topicKey]);
            await db2.query("delete from topics where dept_name = $1 AND sub_name = $2 AND unit_name=$3 AND topic = $4", [department, subject,unit, topicname]);
           console.log("topic scccessfully deleted");

            res.json(`Topic '${topicname}'  successfully deleted`);
      
    } catch (error) { 
        console.error('Error delete document:', error);
        res.status(500).send('Internal Server Error');
    }
});



//student
//putting the topic in the stu database 
app.post("/stu_add_topic", async (req, res) => {
    try{
        const  department = req.body.dept;
        const subject = req.body.sub;
        const topicname =req.body.topic;
        const new_username=req.body.user_name;
        console.log(new_username);

        const db4 = new pg.Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,  
            database: `${new_username}`, 
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT, 
        });
db4.connect();
        
        const existingRecord = await db4.query("SELECT * FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topicname]);
        
        if (existingRecord.rows.length > 0) {
            res.send(`The topic are already available`);
        } else {
            console.log("topic come to add");
            await db4.query("INSERT INTO topics (dept_name,sub_name,topic) VALUES ($1, $2,$3)", [department, subject, topicname]);
           console.log("topic scccessfully added");
            res.send(`Topic '${topicname}'  successfully added`);
        }  
        db4.end; 
    } catch (error) { 
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});
 
 
//select all topic from given details
app.post("/show_stu_topic", async (req, res) => {
    try{
    const department=req.body.dept;
    const subject = req.body.sub;
    const new_username=req.body.user_name;
    console.log(new_username,department,subject)

    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    const result = await db4.query(`SELECT topic FROM topics WHERE dept_name = $1 AND sub_name = $2`, [department, subject]);
    let topics = result.rows.map(row => row.topic);
   
    res.send(topics);
    db.end;
} catch (error) {
    // Handle any errors that occur during the database query or processing
    console.error('Error fetching topics:', error);
    res.status(500).send('Internal Server Error');
}
});


app.post(`/stu_add_topic_link`,async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const link=req.body.body.link;
    const link_title=req.body.body.link_name;
    const link_desc=req.body.body.description;
    const new_username=req.body.user_name;

    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    console.log(link,link_title,link_desc,department,subject,topic)
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query("INSERT INTO links (link,topic_key,link_title, link_desc) VALUES ($1, $2, $3, $4)", [link, topicKey,link_title,link_desc]);
    res.json("add successfully");
    db4.end;
} catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});


//adding video to stu 
app.post(`/stu_add_topic_video`,async(req,res)=>{
    try{
    console.log(req.body);
    
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const video=req.body.body.link;

    function extractVideoId(videoUrl) {
        // Regular expression to match YouTube video IDs
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = videoUrl.match(regExp);
        if (match && match[2].length === 11) {
            // The video ID is the second element in the match array
            return match[2];
        } else {
            // If no match found or video ID is not 11 characters long, return null
            return null;
        }
    } 
    
    var videoUrl = video;
    var videoId = extractVideoId(videoUrl);
    console.log('YouTube Video ID:', videoId);
    const video_title=req.body.body.link_name;
    const video_desc=req.body.body.description;
    const new_username=req.body.user_name;

    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query("INSERT INTO videos (video, topic_key,video_title,video_desc) VALUES ($1, $2, $3, $4)", [ videoId,topicKey,video_title,video_desc]);
    res.json("add successfully");
    db4.end;
}
catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}

})



//send the  links to  the server
app.post(`/stu_shows_link`,async(req,res)=>{
    try {
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const new_username=req.body.user_name;
  
    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const link=await db4.query("SELECT link,link_title,link_desc FROM links WHERE topic_key =  $1",[topicKey]);
    const links = link.rows.map(row => ({
        link: row.link,
        link_title: row.link_title,
        link_desc: row.link_desc
    }));   
    db4.en
;
res.json(links);
} catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})



//send videos to the server

app.post(`/stu_shows_video`,async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const new_username=req.body.user_name;
 
    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3", [department, subject, topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const video=await db4.query("SELECT video,video_title,video_desc FROM videos WHERE topic_key = $1",[topicKey]);   
    const videos =video.rows.map(row => ({
        video: row.video,
        video_title: row.video_title,
        video_desc: row.video_desc
    }));   
    db4.end;
res.json(videos);
} catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})


// Route to fetch all PDF files
app.post("/stu_show_pdf", async (req, res) => {
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const originalname = req.body.file_n['file_name'];  
    console.log(originalname);
    const new_username=req.body.user_name;
    
    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD, 
        port: process.env.DB_PORT, 
    });
db4.connect();
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    const result = await db4.query(`SELECT document FROM documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    const documents = result.rows[0]; 
    db4.end;
    res.json(documents);
} catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});


//get documents name 
app.post("/stu_doc_name",async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const new_username=req.body.user_name;
 
    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
db4.connect();
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    const documents = await db4.query("SELECT document_title,document_desc,name,class FROM documents WHERE topic_key = $1", [topicKey]);
    const docs = documents.rows.map(row => ({
        document_title: row.document_title,
        document_desc: row.document_desc,
        name: row.name,
        class:row.class
    }));    
    db4.end;
     res.json(docs);
     }catch(error){
        console.error('Error showing doc names:', error);
        res.status(500).json({ error: 'Internal Server Error' });
     }
})

app.post("/stu_add_topic_doc", async (req, res) => {
    try{
        console.log(req.body);
            const department=req.body.dept;
            const subject=req.body.sub;
            const topic=req.body.topic;
           const originalname=req.body.file;
           const buffer= req.body.buffer_base64;
           const document_title= req.body.doc_title; 
           const document_desc= req.body.description;
           const iconClass=req.body.iconClass;
           const new_username=req.body.user_name;

           const db4 = new pg.Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,  
               database: `${new_username}`,
               password: process.env.DB_PASSWORD,
               port: process.env.DB_PORT, 
           });
        console.log(iconClass);
        db4.connect();
        // console.log(buffer);
        const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3", [department, subject, topic]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
        await db4.query('INSERT INTO documents(topic_key,document_title,document_desc,document,name,class) VALUES ($1, $2,$3,$4,$5,$6)', [topicKey,document_title,document_desc,buffer,originalname,iconClass]);
        console.log("file upload successfully");
        
        res.json("file upload successfully"); 
        db4.end;
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Internal Server Error");
    } 
      });     
      



//delete stu document
app.post("/stu_delete_document", async (req, res) => {
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const originalname = req.body.file_n['file_name'];  
    console.log(originalname);
    const new_username=req.body.user_name;

    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
     await db4.query(`delete FROM documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    res.json("delete document successfully");
    db4.end;
} catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}         
});


//delete topic student
app.post("/stu_delete_topic", async (req, res) => {
    try{
        console.log(req.body);
      const  department = req.body.dept;
      const subject = req.body.sub;
        const topicname =req.body.topic;
        const new_username=req.body.user_name;
        console.log(new_username);

        const db4 = new pg.Client({     
            user: process.env.DB_USER,
            host: process.env.DB_HOST,  
            database: `${new_username}`, 
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT, 
        });
db4.connect();
            console.log("topic come to delete");
            const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topicname]);
            const topicKey = topic_key.rows[0].topic_key;
            console.log(topicKey);   
            
            await db4.query("delete from documents where topic_key=$1", [topicKey]);
            await db4.query("delete from links where topic_key=$1", [topicKey]);
            await db4.query("delete from videos where topic_key=$1", [topicKey]);
            console.log("topic and documents scccessfully deleted");
            await db4.query("delete from topics where dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject, topicname]);
            console.log("topic scccessfully deleted");
           
            res.send(`Topic '${topicname}'  successfully deleted`);
        db4.end; 
    } catch (error) { 
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});


//delete links
app.post("/delete_link", async (req, res) => {
    try{

    const department=req.body.dept; 
    const subject=req.body.sub;
    const topic=req.body.topic;
    const link_title = req.body.link_title; 
    const roll=req.body.roll;

   
   if (roll=="stu"){
    try{
    const new_username=req.body.user_name;
    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,   
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db4.query(`delete FROM links WHERE link_title=$1 AND topic_key=$2`, [link_title,topicKey]);
    res.json("delete document successfully");
    db4.end;
} catch(error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}    
    }

    else{
        const unit=req.body.unit;
        const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 topic = $4", [department, subject,unit,topic]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);   
        await db2.query(`delete FROM links WHERE link_title=$1 AND topic_key=$2`, [link_title,topicKey]);
        res.json("delete document successfully");
    }
    }catch(err){
        console.error('Error fetching department data:', err);
        res.status(500).send('Internal Server Error');
    }
     
});

//delete video

app.post("/delete_video", async (req, res) => {

    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const video_title = req.body.video_title; 
    const roll=req.body.roll; 

   
   if (roll=="stu"){
    try{
    const new_username=req.body.user_name;

    const db4 = new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,  
        database: `${new_username}`,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT, 
    });
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3", [department, subject,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db4.query(`delete FROM videos WHERE video_title=$1 AND topic_key=$2`, [video_title,topicKey]);
    res.json("delete video successfully");
    db4.end;
} catch(error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}    
    }

    else{
        try{
        const unit=req.body.unit;
        const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 topic = $4", [department, subject,unit,topic]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);   
        await db2.query(`delete FROM videos WHERE video_title=$1 AND topic_key=$2`, [video_title,topicKey]);
        res.json("delete video successfully");
    }
    catch(err){
        console.error('Error delete video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    }

     
});

 



app.post("/login/auth", async(req,res)=>{
    try{
    console.log("request came for login");
    let cred = await db3.query("SELECT * FROM CREDENTIALS WHERE username = $1",[req.body.username]);
    
    res.json(cred.rows);
} catch (error) {
    console.error("Error occurred during login authentication:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});

app.post("/email", async(req,res)=>{
    try{
    console.log("request came for email");
    let cred = await db3.query("SELECT email FROM CREDENTIALS ")
    res.json(cred.rows);
} catch (error) {
    console.error("Error occurred during email checking:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});

app.post("/register/auth", async(req,res)=>{
    try {    
        console.log("request came for registation")
;    let new_username= req.body.username;
    let new_password= req.body.password;
    console.log(new_password);
    let new_email = req.body.email;
    let the_role = "stud";
    await db3.query("INSERT INTO CREDENTIALS(username,password,role,email) values($1,$2,$3,$4)",[new_username,new_password,the_role,new_email]);
    console.log(new_username); 
    await db3.query(`CREATE DATABASE "${new_username}"`); 

    const db4 = new pg.Client({
        user: process.env.DB_USER,  
        host: process.env.DB_HOST,  
        database: `${new_username}`, 
        password: process.env.DB_PASSWORD, 
        port: process.env.DB_PORT, 
    });
    db4.connect();
    await db4.query("create table topics(topic_key serial NOT NULL PRIMARY KEY,dept_name varchar,sub_name varchar,topic text)");
    await db4.query("create table documents(topic_key integer,document_title varchar,document_desc text,document text,name varchar,class varchar)");
    await db4.query("create table links(link text,topic_key integer,link_title varchar,link_desc text)");
    await db4.query("create table videos(video text,topic_key integer,video_title varchar,video_desc text)");
    await db4.query(`ALTER TABLE "documents" ADD FOREIGN KEY ("topic_key") REFERENCES "topics" ("topic_key")`);
    await db4.query(`ALTER TABLE "links" ADD FOREIGN KEY ("topic_key") REFERENCES "topics" ("topic_key")`);
    await db4.query(`ALTER TABLE "videos" ADD FOREIGN KEY ("topic_key") REFERENCES "topics" ("topic_key")`);
    let cred = await db3.query("SELECT * FROM CREDENTIALS WHERE username = $1",[new_username]);
    db4.end; 
    res.json(cred.rows);
} catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
}); 
 

app.post("/changePass",async(req,res)=>{
      try {  console.log("came to change password");
    let new_pass = req.body.new_password;
    let new_email  = req.body.email;
    console.log(new_email)
    await db3.query("UPDATE credentials SET password = $1 WHERE email = $2",[new_pass,new_email]);
    res.sendStatus(200);
} catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send("Internal Server Error");
} 
});
//  
 
 
  
app.get("/notion_space/:username",async(req,res)=>{

    let user_name = req.params.username;
 
  
    let  student_id = await db7.query("select student_id from users where user_name = $1",[user_name]);
    let space_id = await db8.query("select space_id from space_members where member_id = $1 ",[student_id.rows[0].student_id]);

    let rooms_name = [];
    
    for(let i = 0;i < space_id.rows.length;i++){
        let name = await db8.query("select space_name  from notion_space where space_id = $1",[space_id.rows[i].space_id]);
        name.rows[0]["space_id"]= space_id.rows[i].space_id;
        rooms_name.push(name.rows[0]);
         
    } 

    res.json(rooms_name);
})       
 
   
app.get("/space_detail/:space_id",async(req,res)=>{
    const space_id = parseInt(req.params.space_id);

    console.log(req.params.space_id);
    const details = await db8.query("select * from notion_space where space_id = $1",[space_id])
 
    const creator  = await db7.query("select user_name from users where student_id = $1",[details.rows[0].space_creator])
    details.rows[0]["creator_name"] = creator.rows[0].user_name;
    console.log(details.rows[0])

    res.json(details.rows[0]);
}) 



app.get("/get_group_members/summa", async(req,res)=>{

    const result = await db8.query("select * from space_members where space_id = $1",[3]);

    res.json(result.rows)
}) 

  
  
 



 










db2.end;
db.end;
db3.end;
app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
  });
    