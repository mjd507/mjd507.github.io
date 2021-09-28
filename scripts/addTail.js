// 为每篇文章添加版权，版权内容在 copyright.md 文件中
// copyright = false 表示 不添加版权

// var fs = require('fs');
// hexo.extend.filter.register('before_post_render', function(data){
//         if(data.copyright == false) return data;
//         // Try to read copyright.md
//         try {
//                 var tail = fs.readFileSync('copyright.md');
//                 if(tail && data.content.length > 50)
//                 {
//                        data.content += tail;
//                 }
//         } catch (err) {
//                 if (err.code !== 'ENOENT') throw err;
//                 // No process for ENOENT error
//         }
//         // 添加具体文章链接, 不需要去掉即可
//         //var permalink = '\n本文出自"Jack Wang Blog"：' + data.permalink;
//         //data.content += permalink;
//         return data;
// });