const verifyEmailTemplate =({name,url})=>{
    return `
    <p>${name}<p>
    <p>Thank you for registering online shop</p>
    <a href =${url} style="color:ehite;background:blue;margin-top:10px">
    Verify Email
    <a>
    `
}

export default verifyEmailTemplate