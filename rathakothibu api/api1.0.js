import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import 'dotenv/config';
import cron from 'node-cron';
import crypto from 'crypto';  // Crypto is a built-in module, no need to install it
import bwipjs from 'bwip-js';
import eccrypto from 'eccrypto';
import fs from 'fs';
import qrcode from 'qrcode';

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'zenotion_departments', 
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
}); 
 
const db2 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'zenotion_teachers',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, 
}); 

const db3 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'zenotion_authentication',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const db5 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'zenotion_students',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const db4 = new pg.Client({
    user: "zenotion",
    host: "postgresql.selfmade.ninja",
    database: 'zenotion_space',
    password: "m@ssm@ni",
    port: "5432",
});





const app = express();
const port = 3000;
app.use(express.static("public"));
const upload = multer();
app.use(bodyParser.urlencoded({ extended: true,limit:'100mb' }));
app.use(bodyParser.json({limit:'100mb'}));
app.use(express.json());
db.connect(); 
db2.connect();
db3.connect();
db4.connect().then(()=>{
    console.log("database connected successfully");
}).catch(err=>{
    console.log(`${err}can not connect to database`);
});
db5.connect();

app.get("/h/h",async(req,res)=>{
    res.send("hello");
});
// for send the subject for each sem
app.get("/:dept",async(req,res)=>{

    try{
    var dept = req.params.dept;

    console.log(dept)
    let subs = await db.query(`select * from "utf8mb4_0900_ai_ci".${dept}`);
    let arr = subs.rows;
    console.log(arr);
    let subjs = [[],[],[],[],[],[],[],[]];
    let j=0;
    arr.forEach(x=>{
        let k = ['1','2','3','4','5','6','7','8'];
        for(var i =0;i<=7;i++){
            subjs[i][j] = x[k[i]];
        }
        j++;
    })
    res.json(subjs);
} catch (error) {
    console.error('Error fetching department data:', error);
    res.status(500).send('Internal Server Error');
}});

app.post("/topics", async (req, res) => {
    try {
        const department = req.body.dept.toLowerCase(); 
        const semester = req.body.sem;
        // Get subjects for the given semester and department
        console.log("hello");
        const subject = await db.query(`SELECT "${semester}" AS subject FROM "utf8mb4_0900_ai_ci"."${department}" WHERE "${semester}" IS NOT NULL`);
        const sub_list = subject.rows.map(row => row.subject);
        // console.log(sub_list);
        // Initialize an array to hold the result
        //subject and each unit topic count
        const sub_and_topiccount = [];
        // Loop through each subject and count topics in each unit
        for (let j = 0; j < sub_list.length; j++) {
            const topic_count = [];
            for (let i = 1; i <= 5; i++) {
                const unit = await db2.query(`SELECT COUNT(topic) FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name =$2 AND unit_name = $3`,[department.toUpperCase(),sub_list[j],i]);
                console.log(unit.rows);
                const count = parseInt(unit.rows[0].count, 10);
                console.log(sub_list[j],i);
                console.log(count);
                topic_count.push(count);     
            }
           // Push the subject and its unit counts to the result array
            sub_and_topiccount.push({ [sub_list[j]]: topic_count });
        }
        // console.log(unit.rows);
        console.log(sub_and_topiccount); 
        // Send the result back to the client
        res.json(sub_and_topiccount);
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
});


//count document,links and videos
app.post("/count_docs_video_link", async (req, res) => {
    try {  
        const department = req.body.dept;
        const subject = req.body.sub; 
        const unit=req.body.unit
        const topics = await db2.query(`SELECT topic FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, subject, unit]);
        const topic_list = topics.rows.map(row => row.topic);
        const sub_and_topiccount = [];
        for (let j = 0; j < topic_list.length; j++) {
            const topic= topic_list[j]; 
            const topic_key_result = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
             console.log(topic_key_result.rows[0].topic_key);
             const topic_key=topic_key_result.rows[0].topic_key;
            const documents = await db2.query("SELECT COUNT(document_title) FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1", [topic_key]);
            const link=await db2.query("SELECT  COUNT(link) FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1",[topic_key]);
            const video=await db2.query("SELECT COUNT(video) FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1",[topic_key]);   
            const documents_count = parseInt(documents.rows[0].count, 10);
            const link_count = parseInt(link.rows[0].count, 10);
            const video_count = parseInt(video.rows[0].count, 10);
            let dlv=[documents_count,link_count,video_count];
            sub_and_topiccount.push({ [topic_list[j]]: dlv });
        }
        console.log("count dlv");
       console.log(sub_and_topiccount) 
        res.json(sub_and_topiccount );
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
}); 

app.post("/count_onetopic_docs_video_link",async(req,res)=>{
    try {  
        const department = req.body.dept;
        const subject = req.body.sub; 
        const unit=req.body.unit;
        const topic=req.body.topic;
            const topic_key_result = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
            console.log(topic_key_result.rows[0].topic_key);
            const topic_key=topic_key_result.rows[0].topic_key;
            const documents = await db2.query("SELECT COUNT(document_title) FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1", [topic_key]);
            const link=await db2.query("SELECT  COUNT(link) FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1",[topic_key]);
            const video=await db2.query("SELECT COUNT(video) FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1",[topic_key]);   
            const documents_count = parseInt(documents.rows[0].count, 10);
            const link_count = parseInt(link.rows[0].count, 10);
            const video_count = parseInt(video.rows[0].count, 10);
            let dlv=[documents_count,link_count,video_count];
        console.log(dlv) 
        res.json(dlv);
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
})

app.post("/dept_syllabus", async (req, res) => {
    const dept = req.body.dept;
  
    try {
      // Fetch the file data from the database
      const result = await db.query(`SELECT syllabus FROM utf8mb4_0900_ai_ci.syllabus where subject is null and department=$1`,[dept]);
      if (result.rows.length === 0) {
        return res.status(404).send('Department not found');
      }
  
      const pdfBuffer = result.rows[0].syllabus;
    

     
    //   const binaryData = pdfBuffer.toString('binary');
    //   console.log(binaryData); // Logs the binary data of the PDF

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.json(pdfBuffer);
    } catch (err) {
      console.log(err);
      res.status(500).send('Error retrieving syllabus');
    }
  });

  app.post("/sub_syllabus", async (req, res) => {
    const dept =req.body.dept; 
    const sub=req.body.sub;
    console.log(sub); 
  
    try {
        console.log("came to view syllabus");
      const result = await db.query(`SELECT syllabus FROM utf8mb4_0900_ai_ci.syllabus WHERE department=$1 and subject=$2`, [dept,sub]);
      console.log(result);
      const pdf = result.rows[0].syllabus;
      console.log(pdf);
      res.setHeader('Content-Type', 'image/png');   
      res.json(pdf);
    }catch(err){
  console.log(err);
    }
  
  });

  app.post("/name_desc",async(req,res)=>{
    const dept=req.body.dept;

    const result= await db.query(`SELECT name, dept_desc FROM utf8mb4_0900_ai_ci.name_and_desc WHERE dept_name =$1`,[dept]);
    
    console.log(result.rows[0].dept_desc);
    res.json(result.rows[0]);

  })

  app.post("/units_for_each_sub",async(req,res)=>{
    console.log(req.body);
    
    const sub=req.body.sub.toUpperCase();
    console.log(sub);
    const result=await db.query(`select syllabus from utf8mb4_0900_ai_ci.units_for_each_subject where sub=$1`,[sub]);
    console.log(result.rows);
    res.json(result.rows);
  })

//putting the topic in the database 
app.post("/department/subject/unit", async (req, res) => {
    try{
    const department = req.body.dept;
    const subject= req.body.sub;
    const unit= req.body.unit;
        const topicname =req.body.topic;
        const description=req.body.des;
        console.log(topicname,description);
        const existingRecord = await db2.query("SELECT * FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topicname]);
        if (existingRecord.rows.length > 0) {
            res.send(`The topic are already available`);
        } else {
            await db2.query("INSERT INTO utf8mb4_0900_ai_ci.topics (dept_name, sub_name, unit_name, topic,class) VALUES ($1, $2, $3, $4,$5)", [department, subject, unit, topicname,description]);
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
    const result = await db2.query(`SELECT topic,class FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, subject, unit]);
    let topics = result.rows;
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
       const buffer= req.body.buffer;
       const document_title= req.body.doc_title; 
       const document_desc= req.body.description;
       const iconClass=req.body.iconClass; 
       console.log(buffer);
       
     const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
     const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);
    await db2.query('INSERT INTO utf8mb4_0900_ai_ci.documents (topic_key,document_title,document_desc,document,name,class) VALUES ($1,$2,$3,$4,$5,$6)', [topicKey,document_title,document_desc,buffer,originalname,iconClass]);
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
    console.log(req.body)
    const subject=req.body.sub;
    const unit=req.body.unit;
    const topic=req.body.topic;
    const originalname = req.body['file_name'];  
    console.log(originalname);       
    // const originalname = req.body.file_n['file_name'];  

      // Fetch the PDF file data from the database
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    const result = await db2.query(`SELECT document FROM utf8mb4_0900_ai_ci.documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    const documents = result.rows[0].document;  

    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'inline; filename=' + originalname);
    res.send(documents);  // Directly send the binary data

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
    const link_desc=req.body.body.discription;
    console.log(link,link_title,link_desc,department,subject,unit,topic)
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db2.query("INSERT INTO utf8mb4_0900_ai_ci.links (link,topic_key,link_title, link_desc) VALUES ($1, $2, $3, $4)", [link, topicKey,link_title,link_desc]);
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
    const video=req.body.body.link_name;
    const video_title=req.body.body.topic;
    const video_desc=req.body.body.discription;

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
    
    var videoId = extractVideoId(video);
    console.log('YouTube Video ID:', videoId);
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    await db2.query("INSERT INTO utf8mb4_0900_ai_ci.videos (video, topic_key,video_title,video_desc) VALUES ($1, $2, $3, $4)", [ videoId,topicKey,video_title,video_desc]);
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

    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key;
    const documents = await db2.query("SELECT document_title,document_desc,name,class FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1", [topicKey]);
    const docs = documents.rows;
    // .map(row => ({
    //     document_title: row.document_title,
    //     document_desc: row.document_desc,
    //     name: row.name,
    //     class:row.class
    // }));    
    console.log(docs);
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
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const link=await db2.query("SELECT link,link_title,link_desc FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1",[topicKey]);
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
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
    const topicKey = topic_key.rows[0].topic_key; 
    const video=await db2.query("SELECT video,video_title,video_desc FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1",[topicKey]);   
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
    const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 AND topic = $4", [department, subject,unit,topic]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db2.query(`delete FROM utf8mb4_0900_ai_ci.documents WHERE name=$1 AND topic_key=$2`, [originalname,topicKey]);
    res.json("delete document successfully");
} catch (error) {
    console.error('Error delete document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}         
});
  
//delete topic
app.delete("/delete_topic", async (req, res) => {
    try{
        const  department = req.body.dept;
        const subject = req.body.sub;
        const topicname =req.body.topic;
        const unit=req.body.unit; 
        console.log(req.body);  
        console.log("yes");
        const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name =$3 AND topic = $4", [department, subject,unit,topicname]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);     

            console.log("topic come to delete");
            await db2.query("delete from utf8mb4_0900_ai_ci.documents where topic_key=$1", [topicKey]);
            await db2.query("delete from utf8mb4_0900_ai_ci.links where topic_key=$1", [topicKey]);
            await db2.query("delete from utf8mb4_0900_ai_ci.videos where topic_key=$1", [topicKey]);
            await db2.query("delete from utf8mb4_0900_ai_ci.topics where dept_name = $1 AND sub_name = $2 AND unit_name=$3 AND topic = $4", [department, subject,unit, topicname]);
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
        const desc=req.body.topic_desc;
        const new_username=req.body.user_name;
        console.log(new_username,desc); 
        
        const existingRecord = await db5.query("SELECT * FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topicname,new_username]);
        
        if (existingRecord.rows.length > 0) { 
            res.send(`The topic are already available`);
        } else { 
            console.log("topic come to add");
            await db5.query("INSERT INTO utf8mb4_0900_ai_ci.topics (dept_name,sub_name,topic,user_name,topic_desc) VALUES ($1, $2,$3,$4,$5)", [department, subject, topicname,new_username,desc]);
           console.log("topic scccessfully added");
            res.send(`Topic '${topicname}'  successfully added`);
        }   
         
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
    const result = await db5.query(`SELECT topic,topic_desc FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 and user_name=$3`, [department, subject,new_username]);
    let topics = result.rows;
    res.json(topics);
    db.end;
} catch (error) {
    // Handle any errors that occur during the database query or processing
    console.error('Error fetching topics:', error);
    res.status(500).send('Internal Server Error');
}
});

app.post("/count_stu_onetopic_docs_video_link",async(req,res)=>{
    try {  
        const department = req.body.dept;
        const subject = req.body.sub; 
        const topic=req.body.topic;
        const new_username=req.body.user_name;
            const topic_key_result = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND user_name=$3 AND topic = $4", [department, subject, new_username, topic]);
            console.log(topic_key_result.rows[0].topic_key);
            const topic_key=topic_key_result.rows[0].topic_key;
            const documents = await db5.query("SELECT COUNT(document_title) FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1", [topic_key]);
            const link=await db5.query("SELECT  COUNT(link) FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1",[topic_key]);
            const video=await db5.query("SELECT COUNT(video) FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1",[topic_key]);   
            const documents_count = parseInt(documents.rows[0].count, 10);
            const link_count = parseInt(link.rows[0].count, 10);
            const video_count = parseInt(video.rows[0].count, 10);
            let dlv=[documents_count,link_count,video_count];
        console.log(dlv) 
        res.json(dlv);
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
})

//count document,links and videos
app.post("/count_stu_docs_video_link", async (req, res) => {
    try {  
        const department = req.body.dept;
        const subject = req.body.sub;
        const username=req.body.user_name;
        console.log("come to count dlv 1");
        const topics = await db5.query(`SELECT topic FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 and user_name=$3`, [department, subject,username]);
        const topic_list = topics.rows.map(row => row.topic);
        const sub_and_topiccount = [];
        for (let j = 0; j < topic_list.length; j++) {  
            const topic= topic_list[j]; 
            const topic_key_result = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,username]);
             
             const topic_key=topic_key_result.rows[0].topic_key;
             console.log(topic_key);
           
            const documents = await db5.query("SELECT COUNT(document_title) FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1", [topic_key]);
           
            const link=await db5.query("SELECT  COUNT(link) FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1",[topic_key]);
            
            const video=await db5.query("SELECT COUNT(video) FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1",[topic_key]);   
            
            const documents_count = parseInt(documents.rows[0].count, 10);     
            const link_count = parseInt(link.rows[0].count, 10);
            const video_count = parseInt(video.rows[0].count, 10);

            console.log(documents_count,link_count,video_count);

            let dlv=[documents_count,link_count,video_count];
            sub_and_topiccount.push({ [topic_list[j]]: dlv });

            console.log(sub_and_topiccount);
        }
        console.log("come to count dlv 2");
       console.log(sub_and_topiccount) 
        res.json(sub_and_topiccount );
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while processing your request.");
    }
}); 



app.post(`/stu_add_topic_link`,async(req,res)=>{
    try{
    const department=req.body.dept;
    const subject=req.body.sub;
    const topic=req.body.topic;
    const link=req.body.body.link;
    const link_title=req.body.body.link_name;
    const link_desc=req.body.body.discription;
    const new_username=req.body.user_name;
    console.log(link,link_title,link_desc,department,subject,topic)
    const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    await db5.query("INSERT INTO utf8mb4_0900_ai_ci.links (link,topic_key,link_title, link_desc,user_name) VALUES ($1, $2, $3, $4,$5)", [link, topicKey,link_title,link_desc,new_username]);
    res.json("add successfully");
  
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
    const video=req.body.body.link_name;
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
    const video_title=req.body.body.topic;
    const video_desc=req.body.body.discription;
    const new_username=req.body.user_name;
const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    await db5.query("INSERT INTO utf8mb4_0900_ai_ci.videos (video, topic_key,video_title,video_desc,user_name) VALUES ($1, $2, $3, $4,$5)", [ videoId,topicKey,video_title,video_desc,new_username]);
    res.json("add successfully");
    
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
   const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key; 
    const link=await db5.query("SELECT link,link_title,link_desc FROM utf8mb4_0900_ai_ci.links WHERE topic_key =  $1 and user_name=$2",[topicKey,new_username]);
    const links = link.rows.map(row => ({
        link: row.link,
        link_title: row.link_title,
        link_desc: row.link_desc
    }));   
 
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
    console.log(req.body);
    const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key; 
    const video=await db5.query("SELECT video,video_title,video_desc FROM utf8mb4_0900_ai_ci.videos WHERE topic_key = $1 and user_name=$2",[topicKey,new_username]);   
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
// Route to fetch all PDF files
app.post("/stu_show_pdf", async (req, res) => {
    try{
    const department=req.body.dept;
    console.log(req.body);
    const subject=req.body.sub;
    const topic=req.body.topic;
    const originalname = req.body['file_name'];  
    console.log(originalname);
    const new_username=req.body.user_name;

      // Fetch the PDF file data from the database
    const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);  
    const result = await db5.query(`SELECT document FROM utf8mb4_0900_ai_ci.documents WHERE name=$1 AND topic_key=$2 and user_name=$3`, [originalname,topicKey,new_username]);
    const documents = result.rows[0].document; 
    console.log(documents);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + originalname);
    res.send(documents);  // Directly send the binary data
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
 const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    const documents = await db5.query("SELECT document_title,document_desc,name,class FROM utf8mb4_0900_ai_ci.documents WHERE topic_key = $1 and user_name=$2", [topicKey,new_username]);
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

app.post("/stu_add_topic_doc", async (req, res) => {
    try{
        console.log(req.body);
            const department=req.body.dept;
            const subject=req.body.sub;
            const topic=req.body.topic;
           const originalname=req.body.file;
           const buffer= req.body.buffer;
           const document_title= req.body.doc_title; 
           const document_desc= req.body.description;
           const iconClass=req.body.iconClass;
           const new_username=req.body.user_name;
        console.log(iconClass);
        
        // console.log(buffer);
        const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3 and user_name=$4", [department, subject, topic,new_username]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
        await db5.query('INSERT INTO utf8mb4_0900_ai_ci.documents(topic_key,document_title,document_desc,document,name,class,user_name) VALUES ($1, $2,$3,$4,$5,$6,$7)', [topicKey,document_title,document_desc,buffer,originalname,iconClass,new_username]);
        console.log("file upload successfully");
        
        res.json("file upload successfully"); 
      
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

 
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
     await db5.query(`delete FROM utf8mb4_0900_ai_ci.documents WHERE name=$1 AND topic_key=$2 and user_name=$3`, [originalname,topicKey,new_username]);
    res.json("delete document successfully");
    
} catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}         
});


//delete topic student
app.delete("/stu_delete_topic", async (req, res) => {
    try{
        console.log(req.body);
      const  department = req.body.dept;
      const subject = req.body.sub;
        const topicname =req.body.topic;
        const new_username=req.body.user_name;
        console.log(new_username); 

  
            console.log("topic come to delete");
            const topic_key = await db5.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topicname,new_username]);
            const topicKey = topic_key.rows[0].topic_key;
            console.log(topicKey);   
            
            await db5.query("delete from utf8mb4_0900_ai_ci.documents where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            await db5.query("delete from utf8mb4_0900_ai_ci.links where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            await db5.query("delete from utf8mb4_0900_ai_ci.videos where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            console.log("topic and documents scccessfully deleted");
            await db5.query("delete from utf8mb4_0900_ai_ci.topics where dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topicname,new_username]);
            console.log("topic scccessfully deleted");
           
            res.send(`Topic '${topicname}'  successfully deleted`);
         
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

      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db5.query(`delete FROM utf8mb4_0900_ai_ci.links WHERE link_title=$1 AND topic_key=$2 and user_name=$3`, [link_title,topicKey,new_username]);
    res.json("delete document successfully");
   
} catch(error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}    
    }

    else{
        const unit=req.body.unit;
        const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 topic = $4", [department, subject,unit,topic]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);   
        await db2.query(`delete FROM utf8mb4_0900_ai_ci.links WHERE link_title=$1 AND topic_key=$2`, [link_title,topicKey]);
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

                                 
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db5.query(`delete FROM utf8mb4_0900_ai_ci.videos WHERE video_title=$1 AND topic_key=$2 and user_name=$3`, [video_title,topicKey,new_username]);
    res.json("delete video successfully");
    
} catch(error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}    
    }

    else{
        try{
        const unit=req.body.unit;
        const topic_key = await db2.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE dept_name = $1 AND sub_name = $2 AND unit=$3 topic = $4", [department, subject,unit,topic]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);   
        await db2.query(`delete FROM utf8mb4_0900_ai_ci.videos WHERE video_title=$1 AND topic_key=$2`, [video_title,topicKey]);
        res.json("delete video successfully");
    }
    catch(err){
        console.error('Error delete video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    }

     
});

//session part
app.post("/login/auth", async(req,res)=>{
    try{
    console.log("request came for login");
    let cred = await db3.query("SELECT * FROM utf8mb4_0900_ai_ci.CREDENTIALS WHERE username = $1",[req.body.username]);
    console.log(cred.rows);
    res.json(cred.rows);
} catch (error) {
    console.error("Error occurred during login authentication:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});

app.post("/email", async(req,res)=>{
    try{
    console.log("request came for email");
    let cred = await db3.query("SELECT email FROM utf8mb4_0900_ai_ci.CREDENTIALS ")
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
    let cred = await db3.query("SELECT * FROM utf8mb4_0900_ai_ci.CREDENTIALS WHERE username = $1",[new_username]);
    await db3.query("INSERT INTO utf8mb4_0900_ai_ci.CREDENTIALS(username,password,role,email) values($1,$2,$3,$4)",[new_username,new_password,the_role,new_email]);
    // await db5.query("INSERT INTO utf8mb4_0900_ai_ci.users(user_name) values($1)",[req.body.username]);
    console.log("name insert successfully in user table"); 
    
    console.log(new_username); 
    
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
    await db3.query("UPDATE utf8mb4_0900_ai_ci.credentials SET password = $1 WHERE email = $2",[new_pass,new_email]);
    res.sendStatus(200);
} catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send("Internal Server Error");
}
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//zenotion room

app.post("/create_space",async(req,res)=>{
    const sname=req.body.sname;
    const description=req.body.desc;
    const group_profile=req.body.g_profile;
    const user_profile=req.body.u_profile;
    const creator_name=req.body.username;
    const space_mode=req.body.space_mode;
    const email=req.body.email;
   console.log("space");
    const sid_query=await db4.query(`insert into utf8mb4_0900_ai_ci.space (space_name,description,profile,creator_name,space_mode,email) values($1,$2,$3,$4,$5,$6) RETURNING space_id`,[sname,description,group_profile,creator_name,space_mode,email]);
    console.log(sid_query.rows[0].space_id);
    const sid=sid_query.rows[0].space_id;
    const query=await db4.query(`insert into utf8mb4_0900_ai_ci.members (space_id,user_name,user_profile,is_admin) values($1,$2,$3,$4)`,[sid,creator_name,user_profile,"true"])
   //insert lables
    const lables = ["machine learning", "artificial intelligence", "iot", "cyber security", "blockchain", "robotics"];
    const values = lables.map((lable, index) => `($1,$2, $${index + 3})`).join(', ');
    const params = [sid, ...lables,creator_name];
    const lableQuery = await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.lables(space_id,created_by,lable_name) VALUES ${values} RETURNING *`, params);
    console.log("seccessfull");
    const lableIds = lableQuery.rows.map(row => row.lable_id);
    console.log(lableIds);
    res.json("successfully space created");
})

app.post("/add_lable_group",async(req,res)=>{
    try{    
    const { space_id, lable,user_name,lable_desc} = req.body;
//retrive space mode using space id
        const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
        const space_mode=space_mode_query.rows.map(row=>row.space_mode);
        console.log(space_mode);
//member or not 
        const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, user_name]);
        if (memberresult.rowCount === 0) {
            return res.status(403).json({ error: 'Only space members can add a topic.' });
        }
        console.log("member available");
//check lable already availabkle or not
        console.log("come to check lable already available or not");
        const lablequery = await db4.query(`SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2 `, [space_id, lable]);
        if (lablequery.rows.length > 0) {
            return res.status(409).send('lable already exists');
        }
//check private or public
        if(space_mode=="private"){
          console.log("come to check private or public");
          await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.lables (space_id ,lable_name,created_by) VALUES ($1, $2,$3)`, [space_id,lable,user_name]);
          console.log("lable added successfully");
          res.json("lable added successfully");
        }
        if(space_mode=="public"){
            const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id,user_name]);
            if (adminCheckResult.rows[0].is_admin){
                await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.lables (space_id ,lable_name,created_by) VALUES ($1, $2,$3)`, [space_id,lable,user_name]);
                console.log("lable added successfully");
                res.json("lable added successfully");
                }
            else{
            console.log("come request to add lable for public group");
            await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.notifications (space_id, title, title_desc, username, type) VALUES ($1, $2, $3, $4,$5)`, [space_id, lable, lable_desc, user_name,"add_lable"]);
            res.json({ message: 'Request submitted successfully.'});
            }
        }
} catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
}  
}) 

app.post("/add_topic_group", async (req, res) => {
    try {
        const { space_id, lable, topic,topic_desc,username } = req.body;
//check space mode 
        const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
        const space_mode=space_mode_query.rows.map(row=>row.space_mode);
        console.log(space_mode);
//check member or not
        const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
        if (memberresult.rowCount === 0) {
            return res.status(403).json({ error: 'Only space members can add a topic.' });
        }
        console.log("member available");
//check topic already available or not   
        const lable_query=await db4.query(`select lable_id from utf8mb4_0900_ai_ci.lables where space_id=$1 and lable_name=$2`,[space_id,lable]);
        const lable_id = lable_query.rows[0].lable_id;
        console.log(lable_id);
        const topicQuery = await db4.query(`SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2`, [topic, lable_id]);
        if (topicQuery.rows.length > 0) {
            return res.status(409).send('Topic already exists');
        }               
//select topic_key from topic
        if(space_mode=="private"){
        // Insert topic into topics table
        await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.topics (topic_name,topic_desc,lable_id,created_by) VALUES ($1, $2, $3,$4)`, [topic, topic_desc, lable_id,username]);
        console.log("Topic added successfully");
        res.status(201).send('Topic added successfully');
        }
        if(space_mode=="public"){
            const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id,username]);
            if ( adminCheckResult.rows[0].is_admin){
                await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.topics (topic_name,topic_desc,lable_id,created_by) VALUES ($1, $2, $3,$4)`, [topic, topic_desc, lable_id,username]);
                console.log("Topic added successfully");
                res.status(201).send('Topic added successfully');
                }
            else{
            console.log("come request to add topic for public group");
            await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.notifications (space_id, title, title_desc, username, type,label_name) VALUES ($1, $2, $3, $4,$5,$6)`, [space_id, topic, topic_desc, username,"add_topic",lable]);
            res.json({ message: 'Request submitted successfully to add topic.'});
            }

        }    
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////finished utf8mb4_0900_ai_ci.
app.post("/add_doc_group", async (req, res) => {
    try{
        console.log(req.body);
        const { username, space_id, topic, lable,originalname, buffer, document_title,document_desc, iconClass } = req.body;
        console.log(iconClass);
//check member or not
        const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
        if (memberresult.rowCount === 0) {
            return res.status(403).json({ error: 'Only space members can add a document.' });
        }
        console.log("member available");
        const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        // console.log(buffer);
        const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
        console.log(topic_key.rows[0]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
        await db4.query('INSERT INTO utf8mb4_0900_ai_ci.documents(topic_key,document_title,document_desc,document,name,class,created_by) VALUES ($1, $2,$3,$4,$5,$6,$7)', [topicKey,document_title,document_desc,buffer,originalname,iconClass,username]);
        console.log("file upload successfully");
        res.json("file upload successfully"); 
      
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Internal Server Error");
    } 
      }); 

app.post(`/add_video_group`,async(req,res)=>{
        try{
        console.log(req.body);
        const { space_id, topic, lable, video, username, video_title, video_desc } = req.body;
        console.log(video);
//check member or not
        const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
        if (memberresult.rowCount === 0) {
            return res.status(403).json({ error: 'Only space members can add a video.' });
        }
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
        var videoId = extractVideoId(video);
        console.log('YouTube Video ID:', videoId);

        const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);
        await db4.query("INSERT INTO utf8mb4_0900_ai_ci.videos (video, topic_key,video_title,video_desc,created_by) VALUES ($1, $2, $3, $4,$5)", [videoId,topicKey,video_title,video_desc,username]);
        res.json("add successfully");
        
    }
catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post(`/add_link_group`,async(req,res)=>{
    try{
    const { space_id, lable, topic, link, link_title, link_desc ,username} = req.body;
//check member or not
    const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
    if (memberresult.rowCount === 0) {
        return res.status(403).json({ error: 'Only space members can add a link.' });
    }
    const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);

    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query("INSERT INTO utf8mb4_0900_ai_ci.links (link,topic_key,link_title, link_desc,created_by) VALUES ($1, $2, $3, $4,$5)", [link, topicKey,link_title,link_desc,username]);
    res.json("add successfully");
  
} catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});



app.post("/resolve_notification", async (req, res) => {
    const { notification_id, admin_username, status, admin_reason ,space_id} = req.body;

    try {
        const notificationResult = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.notifications WHERE notification_id = $1`, [notification_id]);
        const notification = notificationResult.rows[0];
        console.log(notification);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }
        const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [notification.space_id, admin_username]);
        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can resolve notifications.' });
        }



        if (status === 'allow' && notification.type === 'add_topic') {
//check topic already available or not   
        const lable_query=await db4.query(`select lable_id from utf8mb4_0900_ai_ci.lables where space_id=$1 and lable_name=$2`,[space_id,notification.lable_name]);
        const lable_id = lable_query.rows[0].lable_id;
        console.log(lable_id);
        const topicQuery = await db4.query(`SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2`, [notification.title, lable_id]);
        if (topicQuery.rows.length > 0) {
            return res.status(409).send('Topic already exists');
        }      
            await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.topics (topic_name, topic_desc, lable_id, created_by) VALUES ($1, $2, $3, $4)`, [ notification.title, notification.title_desc,lable_id ,notification.username]);
            await db4.query(`UPDATE utf8mb4_0900_ai_ci.notifications SET status = $1, admin_reason = $2, resolved_at = CURRENT_TIMESTAMP  WHERE notification_id = $3 `, [status, admin_reason, notification_id]);
        }


        if (status === 'allow' && notification.type === 'delete_topic') {
            // Check if the label exists
            const lable_query=await db4.query(`select lable_id from utf8mb4_0900_ai_ci.lables where space_id=$1 and lable_name=$2`,[space_id,notification.lable_name]);
            const lable_id = lable_query.rows[0].lable_id;
            console.log(lable_id);
            const topicQuery = await db4.query(`SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2`, [notification.title, lable_id]);
            if (topicQuery.rowCount === 0) {
                return res.status(409).send('Topic not found.');
            }      
            await db4.query(`delete from utf8mb4_0900_ai_ci.topics where lable_id=$1 and topic_name=$2`,[lable_id,notification.title])
            console.log("delete topic successfully");
           await db4.query(`UPDATE utf8mb4_0900_ai_ci.notifications SET status = $1, admin_reason = $2, resolved_at = CURRENT_TIMESTAMP  WHERE notification_id = $3 `, [status, admin_reason, notification_id]);       
       }




        if (status === 'allow' && notification.type === 'add_lable') {
            const labelCheckResult = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2`, [space_id, notification.title]);
            if (labelCheckResult.rows.length > 0) {
                return res.status(404).json({ error: 'Lable already exist.' });
            }
    
            await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.lables (space_id ,lable_name,created_by) VALUES ($1, $2,$3)`, [space_id,notification.title,notification.username]);
            console.log("lable added successfully");
            await db4.query(`UPDATE utf8mb4_0900_ai_ci.notifications SET status = $1, admin_reason = $2, resolved_at = CURRENT_TIMESTAMP  WHERE notification_id = $3 `, [status, admin_reason, notification_id]);       
        }



        if (status === 'allow' && notification.type === 'delete_lable') {
             // Check if the label exists
        const labelCheckResult = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2`, [space_id, notification.title]);
        if (labelCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'Lable not found.' });
        }
            await db4.query(`delete from utf8mb4_0900_ai_ci.lables where space_id=$1 and lable_name=$2`,[space_id,notification.title])
            console.log("successfully deleted lable");
            await db4.query(`UPDATE utf8mb4_0900_ai_ci.notifications SET status = $1, admin_reason = $2, resolved_at = CURRENT_TIMESTAMP  WHERE notification_id = $3 `, [status, admin_reason, notification_id]);       
        }

        if (status === 'deny') {

            await db4.query(`UPDATE utf8mb4_0900_ai_ci.notifications SET status = $1, admin_reason = $2, resolved_at = CURRENT_TIMESTAMP  WHERE notification_id = $3 `, [status, admin_reason, notification_id]);       

        }

        

        res.json({ message: 'Notification resolved successfully.' });
    } catch (err) {
        console.error('Error resolving notification:', err);
        res.status(500).send('Internal Server Error');
    }
});



app.post("/retrieve_notifications", async (req, res) => {
    const { space_id } = req.body;
    try {
        const notificationsResult = (await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.notifications WHERE space_id = $1 ORDER BY createtimestamp DESC`, [space_id])).rows;
        if (notificationsResult.length === 0) {
            res.json({ message: 'No notifications available' });
        } else {
            res.json(notificationsResult);
        }
    } catch (err) {
        console.error('Error retrieving notifications:', err);
        res.status(500).send('Internal Server Error');
    }
});

//////////////////////////////////////////////////////////////////////////////////////
//retrive or get

app.post("/retrive_spaces",async(req,res)=>{
    try{ 
    const user = req.body.username;
    console.log(user);
    const query_space=await db4.query(`SELECT s.space_id, s.space_name, s.description ,s.profile,s.created_at,m.user_profile,m.is_admin,m.join_date FROM utf8mb4_0900_ai_ci.space s JOIN utf8mb4_0900_ai_ci.members m ON s.space_id = m.space_id WHERE m.user_name = $1`,[req.body.username]);
    console.log(query_space);
    const space=query_space.rows;
    console.log(space);
    res.json(space);
    }catch{  
        console.error("Error retrive spaces:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}) 
app.post("/retrive_space_details", async (req, res) => {
    const { space_id, username } = req.body;

    try {
        // Retrieve space details and mode in one query
        const spaceQuery = `
            SELECT s.space_mode, s.* 
            FROM utf8mb4_0900_ai_ci.space s
            WHERE s.space_id = $1
        `;
        const spaceResult = await db4.query(spaceQuery, [space_id]);

        if (spaceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Space not found' });
        }

        const space = spaceResult.rows[0];
        const { space_mode } = space;

        if (space_mode === "private") {
            // Check if the user is a member of the space
            const memberQuery = `
                SELECT 1 
                FROM utf8mb4_0900_ai_ci.members 
                WHERE space_id = $1 AND user_name = $2
            `;
            const memberResult = await db4.query(memberQuery, [space_id, username]);

            if (memberResult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details, because this is a private space.' });
            }
        }

        // Format created_at to separate date and time
        const createdAt = new Date(space.created_at);
        const createdDate = createdAt.toISOString().split('T')[0];
        const createdTime = createdAt.toISOString().split('T')[1].split('.')[0];

        space.created_date = createdDate;
        space.created_time = createdTime;
        delete space.created_at;

        res.json(space);

    } catch (error) {
        console.error("Error retrieving space details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/retrive_space_members",async(req,res)=>{
    const sid = req.body.space_id;
    const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);
            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}
    console.log(sid);
    const query_space_members=await db4.query(`SELECT m.user_name,m.is_admin FROM utf8mb4_0900_ai_ci.members m JOIN utf8mb4_0900_ai_ci.space s ON m.space_id = s.space_id WHERE s.space_id = $1`,[sid]);
    const space_members = query_space_members.rows.map(row => ({
        user_name: row.user_name,
        is_admin: row.is_admin
    }));
    console.log(space_members);
    res.json(space_members);
})


app.post("/retrive_all_topics_from_space", async (req, res) => {
    try {
      const space_id = req.body.space_id;
      const username=req.body.username;
      //retrive space mode using space id
          const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
          const space_mode=space_mode_query.rows.map(row=>row.space_mode);
          console.log(space_mode);
          if(space_mode=="private"){
          const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
              return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
          }}
      const result = await db4.query(`SELECT l.lable_name,t.topic_name,t.topic_desc FROM utf8mb4_0900_ai_ci.lables l JOIN utf8mb4_0900_ai_ci.topics t ON l.lable_id = t.lable_id WHERE l.space_id = $1`, [space_id]);
      console.log(result.rows);
      res.json(result.rows);
} catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  });

  //retrive specifi topics
  app.post("/retrive_topics", async (req, res) => {
    try {
        const { space_id, lables } = req.body;

        const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);
            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}

        if (!Array.isArray(lables) || lables.length === 0) {
            return res.status(400).json({ error: 'Invalid lables format. Must be a non-empty array.' });
        }

        // Fetch all label IDs for the given space_id and list of labels
        const lablesQuery = await db4.query(
            `SELECT lable_id, lable_name FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = ANY($2::text[])`,
            [space_id, lables]
        );

        if (lablesQuery.rowCount === 0) {
            return res.json([]); // No labels found
        }

        const lableIds = lablesQuery.rows.map(row => row.lable_id);
        const lableMap = lablesQuery.rows.reduce((acc, row) => {
            acc[row.lable_id] = row.lable_name;
            return acc;
        }, {});

        // Fetch all topics for the fetched label IDs
        const topicsQuery = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.topics WHERE lable_id = ANY($1::int[])`,[lableIds]);

        // Format the response
        const topics = topicsQuery.rows.map(row => ({
            lable_name: lableMap[row.lable_id],
            topic: row.topic_name,
            topic_desc: row.topic_desc // assuming the column name for description is topic_desc
        }));

       res.json(topics);
     }catch (err) {
        console.error('Error retrieving topics:', err);
        res.status(500).send('Internal Server Error');
    }
});


  app.post("/retrive_lable",async(req,res)=>{
    try{
    const space_id= req.body.space_id;
    const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);
            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}
    const lable_query=await db4.query(`SELECT * from utf8mb4_0900_ai_ci.lables where space_id=$1`,[space_id]);
    const lables = lable_query.rows.map(row => ({
        lable: row.lable,
        lable_id: row.lable_id
    }));
    res.json(lables);
}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})


app.post("/reteive_links",async(req,res)=>{
    const space_id=req.body.space_id;
    const lable=req.body.lable;
    const topic=req.body.topic;
    const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);
            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}
    const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    const link_query=await db4.query(`select * from utf8mb4_0900_ai_ci.links where topic_key=$1`,[topicKey]);
    const links = link_query.rows.map(row => ({
        link: row.link,
        link_title: row.link_title, 
        link_desc: row.link_desc,
        created_by:row.created_by
    }));   
    res.json(links)
 
})


app.post("/retrive_documents",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
    const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);

            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}

   const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
    const document_query=await db4.query(`select * from utf8mb4_0900_ai_ci.documents where topic_key=$1`,[topicKey]);
    const docs = document_query.rows.map(row => ({
        document_title: row.document_title,
        document_desc: row.document_desc,
        name: row.name,
        class:row.class,
        created_by:row.created_by
    }));    
     res.json(docs);
}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})

app.post("/retrive_group_show_pdf", async (req, res) => {
    try{
        const space_id=req.body.space_id;
        const topic=req.body.topic;
        const lable=req.body.lable;
        const originalname = req.body['file_name'];  
        console.log(originalname);
        const document_title=req.body.document_title;
        const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);  
    const result = await db5.query(`SELECT document FROM utf8mb4_0900_ai_ci.documents WHERE name=$1 AND topic_key=$2 and document_title=$3`, [originalname,topicKey,document_title]);
    const documents = result.rows[0].document; 
    console.log(documents);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + originalname);
    res.send(documents);  // Directly send the binary data
} catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});




app.post("/retrive_videos",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
    const username=req.body.username;
        //retrive space mode using space id
            const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
            const space_mode=space_mode_query.rows.map(row=>row.space_mode);
            console.log(space_mode);

            if(space_mode=="private"){
            const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username]);
            if (memberresult.rowCount === 0) {
                return res.status(403).json({ error: 'Only space members can view the space details , because this is private space.' });
            }}

    console.log(lable);
   const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    const video_query=await db4.query(`select * from utf8mb4_0900_ai_ci.videos where topic_key=$1`,[topicKey]);
    const videos =video_query.rows.map(row => ({
        video: row.video,
        video_title: row.video_title,
        video_desc: row.video_desc,
        created_by:row.created_by
    }));   
   
res.json(videos);
    }catch(err){
        console.error("Error uploading file:", err);
        res.status(500).send("Internal Server Error");
    }
})

  
//////////////////////////////////////////////////////////////////////////////////////////////

//delete



app.delete("/topic_group",async(req,res)=>{
  try{
    const { space_id, lable, topic,topic_desc } = req.body;
    const admin_username=req.body.username;
    const lable_query=await db4.query(`select lable_id from utf8mb4_0900_ai_ci.lables where space_id=$1 and lable_name=$2`,[space_id,lable]);
    const lable_id = lable_query.rows[0].lable_id;
    console.log(lable_id);

    const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
    if (memberresult.rowCount === 0) {
        return res.status(403).json({ error: 'Only space members can delete a topic.' });
    }
    console.log("member available");

    const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
   

    const isAdmin = adminCheckResult.rowCount > 0 && adminCheckResult.rows[0].is_admin;

    if (isAdmin) {
        // Delete the topic if the user is an admin
        await db4.query(`delete from utf8mb4_0900_ai_ci.topics where lable_id=$1 and topic_name=$2`,[lable_id,topic])
        console.log("delete topic successfully");
        res.send("delete topic successfully");
    }
    else{
        console.log("come request to delete topic for group");
        await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.notifications (space_id, title, title_desc, username, type,label_name) VALUES ($1, $2, $3, $4,$5,$6)`, [space_id, topic, topic_desc, admin_username,"delete_topic",lable]);
        res.json({ message: 'Request submitted successfully to add topic.'});
    }
   
   
  }catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
})




app.delete("/lable_group",async(req,res)=>{
    try{
    const { space_id, lable,lable_desc } = req.body;
    const admin_username=req.body.username;
     // Check if the label exists
     const labelCheckResult = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2`, [space_id, lable]);
     if (labelCheckResult.rowCount === 0) {
         return res.status(404).json({ error: 'Lable not found.' });
     }
     //retrive space mode using space id
     const space_mode_query=await db4.query(`select space_mode from utf8mb4_0900_ai_ci.space where space_id=$1`,[space_id]);    
     const space_mode=space_mode_query.rows.map(row=>row.space_mode);
     console.log(space_mode);
//member or not 
     const memberresult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
     if (memberresult.rowCount === 0) {
         return res.status(403).json({ error: 'Only space members can add a topic.' });
     }
     console.log("member available");

     const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id,admin_username]);

        const isAdmin = adminCheckResult.rowCount > 0 && adminCheckResult.rows[0].is_admin;

        if (isAdmin) {
            // Delete the label if the user is an admin
            await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2`,[space_id, lable]);
            console.log("Successfully deleted label");
            return res.json({ message: 'Successfully deleted label.' });
        } else {
            // Otherwise, create a notification for admin review
            await db4.query(`INSERT INTO utf8mb4_0900_ai_ci.notifications (space_id, title, title_desc, username, type) VALUES ($1, $2, $3, $4, $5)`,[space_id, lable, lable_desc, username, "delete_label"]);
            console.log("Request submitted successfully");
            return res.json({ message: 'Request submitted for admin review.' });
        }
    
}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})



 
      
app.delete("/doc_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
   const originalname=req.body.file;
   const admin_username=req.body.username;
   const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
   
   const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        // console.log(buffer);
        const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);
        const checkusernametodeletequery=await db4.query(`select created_by from utf8mb4_0900_ai_ci.videos where topic_key=$1 and name=$2`,[topicKey,originalname])

        const checkusernametodelete = checkusernametodeletequery.rows.map(row => row.created_by);
    console.log(checkusernametodelete);
        if(admin_username!=checkusernametodelete[0] || adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin){
            return res.status(403).json({ error: 'Only created user or admin can delete a vidoe.' });
    
        }
        
        await db4.query(`delete from utf8mb4_0900_ai_ci.documents where topic_key=$1 and name=$2`,[topicKey,originalname])
        console.log("successfully deleted document");

}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})




app.delete("/video_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
    const video_title=req.body.video_title;
    const admin_username=req.body.username

    const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);
    const checkusernametodeletequery=await db4.query(`select created_by from utf8mb4_0900_ai_ci.videos where topic_key=$1 and video_title=$2`,[topicKey,video_title])

    const checkusernametodelete = checkusernametodeletequery.rows.map(row => row.created_by);
console.log(checkusernametodelete);
    if(admin_username!=checkusernametodelete[0] || adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin){
        return res.status(403).json({ error: 'Only created user or admin can delete a vidoe.' });

    }
    await db4.query(`delete from utf8mb4_0900_ai_ci.videos where topic_key=$1 and video_title=$2`,[topicKey,video_title])
    console.log("successfully deleted video");
    res.json("successfully deleted video");
    }catch(err){
        console.error('Error delete video:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})




app.delete("/link_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const lable=req.body.lable;
    const topic=req.body.topic;
    const link_title=req.body.link_name; 
    const admin_username=req.body.username;
    const lable_query = await db4.query("SELECT lable_id FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1 AND lable_name = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

    const topic_key = await db4.query("SELECT topic_key FROM utf8mb4_0900_ai_ci.topics WHERE topic_name = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;

    const checkusernametodeletequery=await db4.query(`select created_by from utf8mb4_0900_ai_ci.links where topic_key=$1 and link_title=$2`,[topicKey,link_title])

    const checkusernametodelete = checkusernametodeletequery.rows.map(row => row.created_by);
console.log(checkusernametodelete);
    if(admin_username!=checkusernametodelete[0] || adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin){
        return res.status(403).json({ error: 'Only created user or admin can delete a vidoe.' });

    }
    await db4.query(`delete from utf8mb4_0900_ai_ci.links where topic_key=$1 and link_title=$2`,[topicKey,link_title])
    console.log("successfully deleted links");
    res.json("successfully deleted links");
    }catch(err){
        console.error("Error adding link:", err);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
})




app.delete("/spaces",async(req,res)=>{ 
     const space_id=req.body.space_id;
     const admin_username=req.body.username
     const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can delete a space.' });
        }
        const spaceCheckResult = await db4.query(
            `SELECT * FROM utf8mb4_0900_ai_ci.space WHERE space_id = $1`,
            [space_id] 
        );

        if (spaceCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'Space not found.' });
        }
        // Optionally, delete related rows in the members table
        await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1`, [space_id]);

        // Optionally, delete related rows in the topics and lables tables
        await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.topics WHERE lable_id IN (SELECT lable_id FROM lables WHERE space_id = $1)`, [space_id]);
        await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.lables WHERE space_id = $1`, [space_id]);
        // Delete the space
        await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.space WHERE space_id = $1`, [space_id]);

        console.log("space deleted successfully");
        res.json({ message: 'Space deleted successfully.' });
})



app.post("/add_members_to_space", async (req, res) => {
    const { space_id, admin_username, new_members } = req.body;

    try {
        console.log(admin_username);
        const adminCheckResult = await db4.query(
            `SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`,
            [space_id, admin_username]
        );

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can add new members to this space.' });
        }

        const newMemberUsernames = new_members.map(member => member.user_name);
        const existingMembersResult = await db4.query(
            `SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = ANY($2::text[])`,
            [space_id, newMemberUsernames]
        );

        const existingMemberUsernames = existingMembersResult.rows.map(row => row.user_name);
        const membersToAdd = new_members.filter(member => !existingMemberUsernames.includes(member.user_name));
        console.log('Members to add:', membersToAdd);

        if (membersToAdd.length === 0) {
            return res.status(400).json({ error: 'All specified users are already members of the space.' });
        }

        const values = membersToAdd.map((member, index) => `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`).join(', ');
        const params = [space_id];
        membersToAdd.forEach(member => {
            params.push(member.user_name, member.user_profile || null, member.is_admin || false);
        });

        console.log('Values to insert:', values);
        console.log('Params:', params);

        await db4.query(
            `INSERT INTO utf8mb4_0900_ai_ci.members (space_id, user_name, user_profile, is_admin) VALUES ${values}`,
            params
        );

        res.status(200).json({ message: 'Members added successfully.', added_members: membersToAdd });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});




app.post("/remove_members_from_space",async(req,res)=>{

    const { space_id, admin_username, username_remove} = req.body;

    try {
        const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can remove members to this space.' });
        }

        const memberCheckResult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username_remove]);

        if (memberCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found in the specified space.' });
        }

        // Step 3: Remove the user from the space
        await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username_remove]);
        console.log("successfully removed that user from space");
        res.json("successfully removed that user from space");
    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



app.post("/make_or_remove_admin",async(req,res)=>{
    
    const { space_id, admin_username, username_makeorremove_admin,admin} = req.body;

    try{
        const adminCheckResult = await db4.query(`SELECT is_admin FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can make or remove admin the user.' });
        }
         // Step 2: Check if the user to be updated is a member of the space
         const memberCheckResult = await db4.query(` SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username_makeorremove_admin]);
        if (memberCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found in the specified space.' });
        }
        // Step 3: Update the is_admin status of the target user
        await db4.query(`UPDATE utf8mb4_0900_ai_ci.members SET is_admin = $1 WHERE space_id = $2 AND user_name = $3`, [admin, space_id, username_makeorremove_admin]);

        // Step 4: Return a success response
        res.status(200).json({ message: 'User admin status updated successfully.' });
    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.post("/exit from space",async(req,res)=>{
    const {space_id,username_remove}= req.body;  
    try{
         const memberCheckResult = await db4.query(`SELECT user_name FROM utf8mb4_0900_ai_ci.members WHERE space_id = $1 AND user_name = $2`, [space_id, username_remove]);    
    if (memberCheckResult.rowCount == 0) { 
        res.status(200).json({ message: 'User not in the space' });
        }
    //Step 3: Remove the user from the space
    await db4.query(`DELETE FROM utf8mb4_0900_ai_ci.members WHERE space id = $1 AND user_name = $2`,[space_id, username_remove]);
    console.log("successfully removed that user from space");
     res.json("successfully removed that user from space" );
    }
     catch(err){
         console.error(err); 
         res.status(500).send("Internal Server Error");
    }})


    app.post("/retrive_random_publicgroups", async (req, res) => {
        try {
          const { rows } = await db4.query(`SELECT * FROM utf8mb4_0900_ai_ci.space WHERE space_mode = 'public' ORDER BY RANDOM() LIMIT 25; `);
          res.status(200).json(rows);
        } catch (error) {
          console.error('Error retrieving public groups:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
  


// Define the task
const truncateNotifications = async () => {
    const query = `
      DELETE FROM utf8mb4_0900_ai_ci.notifications
      WHERE status IN ('allow', 'deny')
      AND createtimestamp < NOW() - INTERVAL '3 days';
    `;
    try {
      const res = await db4.query(query);
      console.log(`Deleted ${res.rowCount} rows from notifications table`);
    } catch (err) {
      console.error('Error executing truncate query:', err);
    }
  };
  
  // Schedule the task to run every 3 days at midnight
  cron.schedule('0 0 */3 * *', truncateNotifications, {
    scheduled: true,
    timezone: 'Asia/Kolkata' // e.g., 'America/New_York'
  });
  
  console.log('Scheduled task to truncate notifications table every 3 days');
  
  // To keep the script running
  process.stdin.resume();

// app.post("/issum",(req,res)=>{
//     let 
// })



//register student detail and ceate barcode
// const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS utf8mb4_0900_ai_ci.studentdata (
//         id SERIAL PRIMARY KEY,           
//         name VARCHAR(255) NOT NULL,      
//         regno VARCHAR(50) UNIQUE NOT NULL,
//         hash TEXT NOT NULL,              
        
//         private_key TEXT NOT NULL,    
//         barcode BYTEA NOT NULL,          
//         created_at TIMESTAMP DEFAULT NOW() 
//     );
// `;

// // Function to create the table
// async function createTable() {
//     try {
//         await db3.query(createTableQuery);
//         console.log('Table "studentdata" created successfully');
//     } catch (error) {
//         console.error('Error creating table:', error);
//     } finally {
//         db3.end(); // Close the connection pool
//     }
// }

// // Call the function to create the table

function hashing(name,regno,password,bloodGroup,dob){
    console.log(name,regno,password,bloodGroup,dob);
    const dataString =`${name}${regno}${password}${bloodGroup}`;
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");
    console.log("Generated hash:", hash);
return hash
}

function aesEncrypt(data, password) {
    const key = crypto.createHash("sha256").update(password).digest(); // Derive AES key from password
    const iv = crypto.randomBytes(16); // Generate a random IV for AES encryption
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]); // Encrypt data
    return { encryptedData: encrypted, iv }; // Return encrypted data and IV
}

// ECC encryption
async function eccEncrypt(data, publicKey) {
    return await eccrypto.encrypt(publicKey, data); // Encrypt using ECC public key
}


app.post("/generate-barcode", async (req, res) => {
    const { name, regno, password, bloodGroup, dob } = req.body;
    console.log(req.body);

    // Validate input
    if (!name || !regno || !password || !bloodGroup || !dob) {
        return res.status(400).send("Missing required fields");
    }

    try {
        console.log("Input received:", { name, regno, password, bloodGroup, dob });

        // Step 1: Hash student details using SHA-256
        const hash = hashing(name, regno, password, bloodGroup, dob);

        console.log("encrypted side hash:", hash);

        // Step 2: Generate ECC key pair (private and public keys)
        const privateKey = crypto.randomBytes(32); // Random private key
        console.log("privatekey", privateKey);
        const publicKey = await eccrypto.getPublic(privateKey); // Get public key from private key

        console.log("Generated ECC key pair and public key");

        // Step 3: Encrypt the hash using ECC public key
        const eccEncryptedData = await eccEncrypt(Buffer.from(hash, "hex"), publicKey); // Encrypt the hash (converted to buffer)

        // Combine the ECC encrypted components
        const eccCombined = Buffer.concat([
            eccEncryptedData.iv,
            eccEncryptedData.ephemPublicKey,
            eccEncryptedData.ciphertext,
            eccEncryptedData.mac,
        ]);
        console.log("ECC Encrypted Data:", eccEncryptedData);

        // Step 4: Encrypt ECC-encrypted data using AES-256-CBC
        const aesEncryptedData = aesEncrypt(eccCombined, password);
        const final_encrypt = aesEncryptedData.encryptedData;

        console.log("AES Encrypted Data:", aesEncryptedData.encryptedData.toString("hex"));

        // Step 5: Generate QR code with the final encrypted data (in hex format)
        await qrcode.toFile(`./${name}_${regno}.png`, final_encrypt.toString("hex"));

        console.log("QR code generated successfully");

        // Step 6: Save encrypted data and other details to the database
        await db3.query(
            "INSERT INTO utf8mb4_0900_ai_ci.studentdetails (name, regno, pass, bloodgroup, dob, iv, privatekey) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [
                name,
                regno,
                password, // You might want to store only the hashed password or other relevant info
                bloodGroup,
                dob,
                aesEncryptedData.iv.toString("hex"),
                privateKey.toString("hex"),
            ]
        );
        console.log("Data saved to the database successfully");

        res.status(200).send("Encryption and saving successful");

    } catch (err) {
        console.error("Error during process:", err);
        res.status(500).send("Internal server error");
    }
});


//decrypt

app.post("/decrypt-barcode", async (req, res) => {
    const { encryptedData, password,regno  } = req.body;

    console.log(req.body)

    // Validate input
    if (!encryptedData || !password) {
        return res.status(400).send("Missing required fields");
    }

    try {

        const decryptdata=await db3.query(`select * from utf8mb4_0900_ai_ci.studentdetails where regno=$1`,[regno]);
        console.log(decryptdata.rows[0]);




        const name=decryptdata.rows[0].name;
        const bloodGroup=decryptdata.rows[0].bloodgroup;
        const dob=decryptdata.rows[0].dob;
    
        
        const hash = hashing(name,regno,password,bloodGroup,dob);
        console.log("decryption hash:", hash);

      

        function aesDecrypt(encrypted, key, iv) {
            const aesKey = crypto.createHash("sha256").update(key).digest();
            const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encrypted, "hex")),
                decipher.final(),
            ]);
            return decrypted;
        }

        // ECC decryption
async function eccDecrypt(encryptedData, privateKey) {
    console.log("come eccdecrypt");
    return await eccrypto.decrypt(privateKey, encryptedData);
}

const ivHex = decryptdata.rows[0].iv; // Assuming this is a hex string

// Convert to Buffer
const ivBuffer = Buffer.from(ivHex, 'hex'); // Specify 'hex' as encoding
console.log('IV Buffer:', ivBuffer);

const aesDecryptedData = aesDecrypt(
    encryptedData,
    decryptdata.rows[0].pass,
    ivBuffer
);

console.log("after aesDecryptedData",aesDecryptedData)
if (aesDecryptedData.length < 113) {
    throw new Error("Decrypted data length is insufficient for ECC structure.");
}
const eccDecryptedData = {
    iv: aesDecryptedData.slice(0, 16),
    ephemPublicKey: aesDecryptedData.slice(16, 81),
    ciphertext: aesDecryptedData.slice(81, aesDecryptedData.length - 32),
    mac: aesDecryptedData.slice(aesDecryptedData.length - 32),
};

console.log("eccDecryptedData",eccDecryptedData);

const privateKeyHex = decryptdata.rows[0].privatekey; // Assuming this is a hex string
console.log("privateKeyHex",privateKeyHex);
// Convert to Buffer
const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
console.log("privateKeyBuffer",privateKeyBuffer);
const decryptedHashedPassword = await eccDecrypt(eccDecryptedData, privateKeyBuffer);
    console.log("Decrypted Hashed Password:", decryptedHashedPassword.toString("hex"));

    if (hash === decryptedHashedPassword.toString("hex")) {
        res.status(200).json({auth:true});
    } else {
        res.status(400).json({auth:false});
    }


    } catch (err) {
        console.error("Error during decryption process:", err);
        res.status(200).json({auth:false});
    }
});




db2.end;
db.end;
db3.end;
db4.end;
db5.end;

app.listen(port, '0.0.0.0',() => {
    console.log(`API is running at http://localhost:${port}`);
  });
    
   

  app.post("/check_email",async(req,res)=>{
    try{
    const email=req.body.email;
    const result=await db3.query(`select email from utf8mb4_0900_ai_ci.credentials where email=$1`,[email]);
    if(result.rowCount === 0){
        res.json("email does not exit")
    }
    else{
        res.json("email available")
    }
}catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
}
})
