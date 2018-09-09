/* global hexo */
// Usage: {% fold ???? %} Something {% endfold %}

hexo.extend.tag.register('fold', function(args, content) {
    var text = args[0];
    if (!text) text = "点击显示/隐藏";
    return '<div><div class="fold_hider"><div class="close hider_title">' + text + '</div></div><div class="fold">\n' + hexo.render.renderSync({ text: content, engine: 'markdown' }) + '\n</div></div>';
}, { ends: true });