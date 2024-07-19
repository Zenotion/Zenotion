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
    port: process.env.DB_PORT,
}); 

const db2 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'teachers',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
}); 

const db3 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'authentication',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const db4 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'zenotion_space',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


const db5 = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'students',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


const app = express();
const port = 3000;
app.use(express.static("public"));
const upload = multer();
app.use(bodyParser.urlencoded({ extended: true,limit:'100mb' }));
app.use(bodyParser.json({limit:'100mb'}));
db.connect();
db2.connect();
db3.connect();
db4.connect();
db5.connect();


// for send the subject for each sem
app.get("/:dept",async(req,res)=>{

    try{
    var dept = req.params.dept;

    console.log(dept)
    let subs = await db.query(`select * from ${dept}`);
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

        console.log(sub_and_topiccount); 

        // Send the result back to the client
        res.send(sub_and_topiccount);
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
        const topics = await db2.query(`SELECT topic FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, subject, unit]);
        const topic_list = topics.rows.map(row => row.topic);
        const sub_and_topiccount = [];
        for (let j = 0; j < topic_list.length; j++) {
            const topic= topic_list[j];
            const topic_key_result = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
             console.log(topic_key_result.rows[0].topic_key);
             const topic_key=topic_key_result.rows[0].topic_key;
            const documents = await db2.query("SELECT COUNT(document_title) FROM documents WHERE topic_key = $1", [topic_key]);
            const link=await db2.query("SELECT  COUNT(link) FROM links WHERE topic_key =  $1",[topic_key]);
            const video=await db2.query("SELECT COUNT(video) FROM videos WHERE topic_key = $1",[topic_key]);   
            const documents_count = parseInt(documents.rows[0].count, 10);
            const link_count = parseInt(link.rows[0].count, 10);
            const video_count = parseInt(video.rows[0].count, 10);
            let dlv=[documents_count,link_count,video_count];
            sub_and_topiccount.push({ [topic_list[j]]: dlv });
        }
       console.log(sub_and_topiccount)
        res.send(sub_and_topiccount );
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
  
    try {
      const result = await db.query(`SELECT syllabus FROM syllabus WHERE department=$1 and subject=$2`, [dept,sub]);
      const pdf = result.rows[0].syllabus;
      res.setHeader('Content-Type', 'image/png');  
      res.json(pdf);
    }catch(err){
  console.log(err);
    }
  
  });

  app.post("/name_desc",async(req,res)=>{
    const dept=req.body.dept;

    const result= await db.query(`select "${dept}" AS dept_value from name_and_desc where "${dept}" is not null`);
    const deptname_and_desc=result.rows.map(row=>row.dept_value);
    console.log(deptname_and_desc[0]);
    res.json(deptname_and_desc);

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
        const existingRecord = await db2.query("SELECT * FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topicname]);
        if (existingRecord.rows.length > 0) {
            res.send(`The topic are already available`);
        } else {
            await db2.query("INSERT INTO topics (dept_name, sub_name, unit_name, topic,class) VALUES ($1, $2, $3, $4,$5)", [department, subject, unit, topicname,description]);
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
    const result = await db2.query(`SELECT topic,class FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3`, [department, subject, unit]);
    let topics = result.rows.map(row => ({
        topic: row.topic,
        class:row.class}));
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
       console.log(iconClass);
    //    console.log(buffer);
     const topic_key = await db2.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND unit_name = $3 AND topic = $4", [department, subject, unit, topic]);
     const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);
    await db2.query('INSERT INTO documents (topic_key,document_title,document_desc,document,name) VALUES ($1, $2,$3,$4,$5)', [topicKey,document_title,document_desc,buffer,originalname]);
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
    console.log(department)
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
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
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

        
        const existingRecord = await db5.query("SELECT * FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topicname,new_username]);
        
        if (existingRecord.rows.length > 0) {
            res.send(`The topic are already available`);
        } else {
            console.log("topic come to add");
            await db5.query("INSERT INTO topics (dept_name,sub_name,topic,user_name) VALUES ($1, $2,$3,$4)", [department, subject, topicname,new_username]);
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
    const result = await db5.query(`SELECT topic FROM topics WHERE dept_name = $1 AND sub_name = $2 and user_name=$3`, [department, subject,new_username]);
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
    console.log(link,link_title,link_desc,department,subject,topic)
    const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    await db5.query("INSERT INTO links (link,topic_key,link_title, link_desc,user_name) VALUES ($1, $2, $3, $4,$5)", [link, topicKey,link_title,link_desc,new_username]);
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
const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    await db5.query("INSERT INTO videos (video, topic_key,video_title,video_desc,user_name) VALUES ($1, $2, $3, $4,$5)", [ videoId,topicKey,video_title,video_desc,new_username]);
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
   const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key; 
    const link=await db5.query("SELECT link,link_title,link_desc FROM links WHERE topic_key =  $1 and user_name=$2",[topicKey,new_username]);
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
    const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key; 
    const video=await db5.query("SELECT video,video_title,video_desc FROM videos WHERE topic_key = $1 and user_name=$2",[topicKey,new_username]);   
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
    const originalname = req.body.file_n['file_name'];  
    console.log(originalname);
    const new_username=req.body.user_name;

      // Fetch the PDF file data from the database
    const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);  
    const result = await db5.query(`SELECT document FROM documents WHERE name=$1 AND topic_key=$2 and user_name=$3`, [originalname,topicKey,new_username]);
    const documents = result.rows[0]; 
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
 const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    const documents = await db5.query("SELECT document_title,document_desc,name,class FROM documents WHERE topic_key = $1 and user_name=$2", [topicKey,new_username]);
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
           const buffer= req.body.buffer_base64;
           const document_title= req.body.doc_title; 
           const document_desc= req.body.description;
           const iconClass=req.body.iconClass;
           const new_username=req.body.user_name;
        console.log(iconClass);
        
        // console.log(buffer);
        const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND  topic = $3 and user_name=$4", [department, subject, topic,new_username]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
        await db5.query('INSERT INTO documents(topic_key,document_title,document_desc,document,name,class,user_name) VALUES ($1, $2,$3,$4,$5,$6,$7)', [topicKey,document_title,document_desc,buffer,originalname,iconClass,new_username]);
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
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
     await db5.query(`delete FROM documents WHERE name=$1 AND topic_key=$2 and user_name=$3`, [originalname,topicKey,new_username]);
    res.json("delete document successfully");
    
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

  
            console.log("topic come to delete");
            const topic_key = await db5.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topicname,new_username]);
            const topicKey = topic_key.rows[0].topic_key;
            console.log(topicKey);   
            
            await db5.query("delete from documents where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            await db5.query("delete from links where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            await db5.query("delete from videos where topic_key=$1 and user_name=$2", [topicKey,new_username]);
            console.log("topic and documents scccessfully deleted");
            await db5.query("delete from topics where dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject, topicname,new_username]);
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
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db5.query(`delete FROM links WHERE link_title=$1 AND topic_key=$2 and user_name=$3`, [link_title,topicKey,new_username]);
    res.json("delete document successfully");
   
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

                                 
      // Fetch the PDF file data from the database
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE dept_name = $1 AND sub_name = $2 AND topic = $3 and user_name=$4", [department, subject,topic,new_username]);
    const topicKey = topic_key.rows[0].topic_key;
    console.log(topicKey);   
    await db5.query(`delete FROM videos WHERE video_title=$1 AND topic_key=$2 and user_name=$3`, [video_title,topicKey,new_username]);
    res.json("delete video successfully");
    
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

//session part
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
    await db5.query("INSERT INTO users(user_name) values($1)",[req.body.username]);
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
    await db3.query("UPDATE credentials SET password = $1 WHERE email = $2",[new_pass,new_email]);
    res.sendStatus(200);
} catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send("Internal Server Error");
}
});

//zenotion room

app.post("/create_space",async(req,res)=>{

    const sname=req.body.sname;
    const description=req.body.desc;
    const group_profile=req.body.g_profile;
    const user_profile=req.body.u_profile;
    console.log(req.body);
    const sid_query=await db4.query(`insert into space (space_name,description,profile) values($1,$2,$3) RETURNING space_id`,[sname,description,group_profile ]);
    console.log(sid_query.rows[0].space_id);
    const sid=sid_query.rows[0].space_id;
    const query=await db4.query(`insert into members (space_id,user_name,user_profile,is_admin) values($1,$2,$3,$4)`,[sid,req.body.user,user_profile,req.body.admin])
   //insert lables
    const lables = ["machine learning", "artificial intelligence", "iot", "cyber security", "blockchain", "robotics"];
    const values = lables.map((lable, index) => `($1, $${index + 2})`).join(', ');
    const params = [sid, ...lables];
    const lableQuery = await db4.query(`INSERT INTO lables(space_id, lable) VALUES ${values} RETURNING *`, params);
    console.log("seccessfull");
    const lableIds = lableQuery.rows.map(row => row.lable_id);
    console.log(lableIds);
    
    res.json("successfully space created");

})

app.post("/add_topic_group", async (req, res) => {
    try {
        const { space_id, lable, topic,topic_desc } = req.body;
        const lable_query=await db4.query(`select lable_id from lables where space_id=$1 and lable=$2`,[space_id,lable]);
        const lable_id = lable_query.rows[0].lable_id;
        console.log(lable_id);

        const topicQuery = await db4.query(`SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2`, [topic, lable_id]);
        if (topicQuery.rows.length > 0) {
            return res.status(409).send('Topic already exists');
        }
        // Insert topic into topics table
        await db4.query(`INSERT INTO topics (topic,topic_desc,lable_id) VALUES ($1, $2, $3)`, [topic, topic_desc, lable_id]);
        
        console.log("Topic added successfully");
        res.status(201).send('Topic added successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/retrive_topics",async(req,res)=>{
    const { space_id, lable} = req.body;
    const lable_query=await db4.query(`select lable_id from lables where space_id=$1 and lable=$2`,[space_id,lable]);
    const lable_id = lable_query.rows[0].lable_id;
    console.log(lable_id);
    const topic=await db4.query(`select * from topics where lable_id=$1`,[lable_id])
    const topics = topic.rows.map(row => ({
        topic: row.topic,
        topic_title: row.topic_title,
        lable_id: row.lable_id
    }));   
    res.json(topics)

})

app.delete("/topic_group",async(req,res)=>{
  try{
    const { space_id, lable, topic } = req.body;
    const admin_username=req.body.username
    const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

    if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'Only admins can delete a topic.' });
    }
    const lable_query=await db4.query(`select lable_id from lables where space_id=$1 and lable=$2`,[space_id,lable]);
    const lable_id = lable_query.rows[0].lable_id;
    console.log(lable_id);
    await db4.query(`delete from topics where lable_id=$1 and topic=$2`,[lable_id,topic])
    console.log("delete topic successfully");
    res.send("delete topic successfully");
  }catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
})

app.post("/add_lable_group",async(req,res)=>{
    try{
    const { space_id, lable } = req.body;
    const lablequery = await db4.query(`SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2`, [space_id, lable]);
        if (lablequery.rows.length > 0) {
            return res.status(409).send('lable already exists');
        }
    await db4.query(`INSERT INTO lables (space_id ,lable) VALUES ($1, $2)`, [space_id,lable]);
    console.log("lable added successfully");
    res.json("lable added successfully");
} catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
}
    
}) 

app.delete("/lable_group",async(req,res)=>{
    try{
    const { space_id, lable } = req.body;
    const admin_username=req.body.username;

    const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

    if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'Only admins can delete a lable.' });
    }
    await db4.query(`delete from lables where space_id=$1 and lable=$2`,[space_id,lable])
   console.log("successfully deleted lable");
   res.json("successfully deleted lable"); 
}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})

app.post("/retrive_lable",async(req,res)=>{
    try{
    const space_id= req.body.space_id;
    const lable_query=await db4.query(`SELECT * from lables where space_id=$1`,[space_id]);
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

app.post("/add_doc_group", async (req, res) => {
    try{
        console.log(req.body);
        const space_id=req.body.space_id;
        const topic=req.body.topic;
        const lable=req.body.lable;
        const originalname=req.body.file;
        const buffer= req.body.buffer;
        const document_title= req.body.doc_title; 
        const document_desc= req.body.description;
        const iconClass=req.body.iconClass;
         
        console.log(iconClass);
        const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        // console.log(buffer);
        const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        console.log(topic_key.rows[0]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
        await db4.query('INSERT INTO documents(topic_key,document_title,document_desc,document,name,class) VALUES ($1, $2,$3,$4,$5,$6)', [topicKey,document_title,document_desc,buffer,originalname,iconClass]);
        console.log("file upload successfully");
        
        res.json("file upload successfully"); 
      
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Internal Server Error");
    } 
      });  
      
app.delete("/doc_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
   const originalname=req.body.file;
   const admin_username=req.body.username;
   const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

   if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
       return res.status(403).json({ error: 'Only admins can delete a document.' });
   }
   const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        // console.log(buffer);
        const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key;
        console.log(topicKey);
        await db4.query(`delete from documents where topic_key=$1 and name=$2`,[topicKey,originalname])
        console.log("successfully deleted document");

}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})

app.post("/retrive_documents",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
   const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key; 
        console.log(topicKey);
    const document_query=await db4.query(`select * from documents where topic_key=$1`,[topicKey]);
    const docs = document_query.rows.map(row => ({
        document_title: row.document_title,
        document_desc: row.document_desc,
        name: row.name,
        class:row.class
    }));    
     res.json(docs);
}catch(err){
    console.error("Error uploading file:", err);
    res.status(500).send("Internal Server Error");
}
})

app.post(`/add_video_group`,async(req,res)=>{
        try{
        console.log(req.body);
        const space_id=req.body.space_id;
        const topic=req.body.topic;
        const lable=req.body.lable;
        const video=req.body.link;
        console.log(video);
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
        const video_title=req.body.link_name;
        const video_desc=req.body.description;
        const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
        const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
        const topicKey = topic_key.rows[0].topic_key;
        await db4.query("INSERT INTO videos (video, topic_key,video_title,video_desc) VALUES ($1, $2, $3, $4)", [videoId,topicKey,video_title,video_desc]);
        res.json("add successfully");
        
    }
catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.delete("/video_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
    const video_title=req.body.video_title;
    const admin_username=req.body.username

    const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

       if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
           return res.status(403).json({ error: 'Only admins can delete a vidoe.' });
       }
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query(`delete from videos where topic_key=$1 and video_title=$2`,[topicKey,video_title])
    console.log("successfully deleted video");
    res.json("successfully deleted video");
    }catch(err){
        console.error('Error adding video:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post("/retrive_videos",async(req,res)=>{
    const space_id=req.body.space_id;
    const topic=req.body.topic;
    const lable=req.body.lable;
    console.log(lable);
   const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
        const lable_id = lable_query.rows[0].lable_id; 
        console.log(lable_id);
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    const video_query=await db4.query(`select * from videos where topic_key=$1`,[topicKey]);
    const videos =video_query.rows.map(row => ({
        video: row.video,
        video_title: row.video_title,
        video_desc: row.video_desc
    }));   
   
res.json(videos);
})

app.post(`/add_link_group`,async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const lable=req.body.lable;
    const topic=req.body.topic;
    const link=req.body.link;
    const link_title=req.body.link_name;
    const link_desc=req.body.description;
    const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);

    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query("INSERT INTO links (link,topic_key,link_title, link_desc) VALUES ($1, $2, $3, $4)", [link, topicKey,link_title,link_desc]);
    res.json("add successfully");
  
} catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
});

app.delete("/link_group",async(req,res)=>{
    try{
    const space_id=req.body.space_id;
    const lable=req.body.lable;
    const topic=req.body.topic;
    const link_title=req.body.link_name;
    const admin_username=req.body.username;
    const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

       if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
           return res.status(403).json({ error: 'Only admins can delete a link.' });
       }
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    await db4.query(`delete from links where topic_key=$1 and link_title=$2`,[topicKey,link_title])
    console.log("successfully deleted links");
    res.json("successfully deleted links");
    }catch(err){
        console.error("Error adding link:", err);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
})

app.post("/reteive_links",async(req,res)=>{
    const space_id=req.body.space_id;
    const lable=req.body.lable;
    const topic=req.body.topic;
    const lable_query = await db4.query("SELECT lable_id FROM lables WHERE space_id = $1 AND lable = $2", [space_id, lable]);
    const lable_id = lable_query.rows[0].lable_id; 
    console.log(lable_id);
    const topic_key = await db4.query("SELECT topic_key FROM topics WHERE topic = $1 AND lable_id = $2", [topic, lable_id]);
    const topicKey = topic_key.rows[0].topic_key;
    const link_query=await db4.query(`select * from links where topic_key=$1`,[topicKey]);
    const links = link_query.rows.map(row => ({
        link: row.link,
        link_title: row.link_title,
        link_desc: row.link_desc
    }));   
    res.json(links)

})

app.post("/retrive_spaces",async(req,res)=>{
    try{
    const user = req.body.username;
    console.log(user);
    const query_space=await db4.query(`SELECT s.space_id, s.space_name, s.description ,s.profile,s.created_at,m.user_profile,m.is_admin,m.join_date FROM space s JOIN members m ON s.space_id = m.space_id WHERE m.user_name = $1`,[req.body.username]);
    const space=query_space.rows;
    console.log(space);
    res.json(space);
    }catch{
        console.error("Error retrive spaces:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
    
app.delete("/spaces",async(req,res)=>{
     const space_id=req.body.space_id;
     const admin_username=req.body.username
     const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can delete a space.' });
        }
        const spaceCheckResult = await db4.query(
            `SELECT * FROM space WHERE space_id = $1`,
            [space_id]
        );

        if (spaceCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'Space not found.' });
        }
        // Optionally, delete related rows in the members table
        await db4.query(`DELETE FROM members WHERE space_id = $1`, [space_id]);

        // Optionally, delete related rows in the topics and lables tables
        await db4.query(`DELETE FROM topics WHERE lable_id IN (SELECT lable_id FROM lables WHERE space_id = $1)`, [space_id]);
        await db4.query(`DELETE FROM lables WHERE space_id = $1`, [space_id]);
        // Delete the space
        await db4.query(`DELETE FROM space WHERE space_id = $1`, [space_id]);

        console.log("space deleted successfully");
        res.json({ message: 'Space deleted successfully.' });
})


app.post("/retrive_space_members",async(req,res)=>{
    const sid = req.body.space_id;
    console.log(sid);
    const query_space_members=await db4.query(`SELECT m.user_name,m.is_admin FROM members m JOIN space s ON m.space_id = s.space_id WHERE s.space_id = $1`,[sid]);
    const space_members = query_space_members.rows.map(row => ({
        user_name: row.user_name,
        is_admin: row.is_admin
    }));
    console.log(space_members);
    res.json(space_members);
})

app.post("/add_members_to_space", async (req, res) => {
    const { space_id, admin_username, new_members } = req.body;

    try {
        console.log(admin_username);
        const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);
        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can add new members to this space.' });
        }

        const newMemberUsernames = new_members.map(member => member.user_name);
        const existingMembersResult = await db4.query(
            `SELECT user_name FROM members WHERE space_id = $1 AND user_name = ANY($2::text[])`,
            [space_id, newMemberUsernames]
        );

        const existingMemberUsernames = existingMembersResult.rows.map(row => row.user_name);
        const membersToAdd = new_members.filter(member => !existingMemberUsernames.includes(member.user_name));

        if (membersToAdd.length === 0) {
            return res.status(400).json('All specified users are already members of the space.' );
        }

        const values = membersToAdd.map((member, index) => `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`).join(', ');
        const params = [space_id];
        membersToAdd.forEach(member => {
            params.push(member.user_name, member.user_profile, member.is_admin || false);
        });

        await db4.query(`INSERT INTO members (space_id, user_name, user_profile, is_admin) VALUES ${values}`, params);

        res.status(200).json({ message: 'Members added successfully.', added_members: membersToAdd });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.post("/remove_members_from_space",async(req,res)=>{

    const { space_id, admin_username, username_remove} = req.body;

    try {
        const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can remove members to this space.' });
        }

        const memberCheckResult = await db4.query(`SELECT user_name FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, username_remove]);

        if (memberCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found in the specified space.' });
        }

        // Step 3: Remove the user from the space
        await db4.query(`DELETE FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, username_remove]);
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
        const adminCheckResult = await db4.query(`SELECT is_admin FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, admin_username]);

        if (adminCheckResult.rowCount === 0 || !adminCheckResult.rows[0].is_admin) {
            return res.status(403).json({ error: 'Only admins can make or remove admin the user.' });
        }
         // Step 2: Check if the user to be updated is a member of the space
         const memberCheckResult = await db4.query(` SELECT user_name FROM members WHERE space_id = $1 AND user_name = $2`, [space_id, username_makeorremove_admin]);
        if (memberCheckResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found in the specified space.' });
        }
        // Step 3: Update the is_admin status of the target user
        await db4.query(`UPDATE members SET is_admin = $1 WHERE space_id = $2 AND user_name = $3`, [admin, space_id, username_makeorremove_admin]);

        // Step 4: Return a success response
        res.status(200).json({ message: 'User admin status updated successfully.' });
    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



  







db2.end;
db.end;
db3.end;
db4.end;
db5.end;

app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
  });
    






