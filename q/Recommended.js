db.collection('RECOMMENDED').get().then((snapshot) => {
    let html=``;
    for (let i=0;i<snapshot.size;i++){
      let imageurl= (snapshot.docs[i].data().imagelink)
      let dis= (snapshot.docs[i].data().dis)
      let rediractlink= (snapshot.docs[i].data().rediractlink)
      html+=`
      <a href="`+rediractlink+`"><img src="`+imageurl+`"></a>
      <link href="https://cdn-images.mailchimp.com/embedcode/classic-10_7.css" rel="stylesheet" type="text/css">
      <div id="mc_embed_signup" style="margin-bottom: 10px;">
              <div id="mc_embed_signup_scroll">
                  <h2>`+dis+`</h2>
                  <a href="`+rediractlink+`" target="_blank" class="button"">TRY IT</a>
              </div>
      </div>
      `;
    }
    document.getElementById("maindivrec").innerHTML=html;
});