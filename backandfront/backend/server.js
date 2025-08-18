import express from 'express'
const app=express()
app.get('/',(req,res)=>{
    res.send('server is read');
});
app.get('/api/jokes',(req,res)=>{
    const jokes=[
        {
            id:1,
            title:'A joke',
            content:'this is joke'
        },
        {
            id:1,
            title:'B joke',
            content:'this is another joke'
        }

    ];
    res.send(jokes);
})
const port=process.env.PORT|| 3000;
app.listen(port,()=>{
    console.log(`server at port ${port}`)
});