<style>
/* 容器布局：使用 Flexbox 实现垂直居中和对齐 */
.pub-row {
  display: flex;
  align-items: center; /* 垂直居中核心代码 */
  margin-bottom: 40px; /* 论文之间的间距 */
  gap: 25px; /* 图片和文字之间的间距 */
}

/* 左侧图片区域 */
.pub-img-col {
  flex: 0 0 250px; /* 固定图片区域宽度，防止挤压 */
  max-width: 250px;
  position: relative;
}

/* 图片样式：圆角 + 阴影 + 悬停效果 */
.teaser-img {
  width: 100%;
  height: auto;
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 轻微阴影 */
  transition: transform 0.2s ease;
  object-fit: cover;
}

.teaser-img:hover {
  transform: scale(1.02); /* 鼠标悬停轻微放大 */
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

/* 徽章样式：右上角悬浮 */
.conf-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #525252; /* 深灰色背景，比纯黑更高级 */
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 2;
}

/* 右侧文字区域 */
.pub-text-col {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title a {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  line-height: 1.4;
}

.author {
  margin-top: 5px;
  font-size: 0.95rem;
  color: #555;
}

.periodical {
  margin-top: 5px;
  font-size: 0.9rem;
  color: #777;
  font-style: italic;
}

/* 按钮区域 */
.links {
  margin-top: 12px;
}

/* 透明按钮样式 (Ghost Button) */
.btn-outline {
  display: inline-block;
  padding: 4px 12px;
  margin-right: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #444; /* 字体深灰 */
  background-color: transparent;
  border: 1px solid #aaa; /* 细边框 */
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.btn-outline:hover {
  color: #fff;
  background-color: #333; /* 悬停变黑 */
  border-color: #333;
  text-decoration: none;
}
</style>

{% include base_path %}

<div class="publications">

<h3>First Author/Co-First Author</h3>
<div class="bibliography">
{% for link in site.data.publications.main %}
{% if link.authors contains "Shengbang Liu*" %}

  <div class="pub-row">
    <div class="pub-img-col">
      {% if link.image %}
        {% assign image_path = link.image | replace: './images/', '/images/' %}
        <img src="{{ image_path | prepend: base_path }}" class="teaser-img">
        {% if link.conference_short %}
          <span class="conf-badge">{{ link.conference_short }}</span>
        {% endif %}
      {% endif %}
    </div>

    <div class="pub-text-col">
      <div class="title">
        <a href="{{ link.pdf }}">{{ link.title }}</a>
      </div>
      <div class="author">{{ link.authors }}</div>
      <div class="periodical">
        {{ link.conference }}
      </div>
      
      <div class="links">
        {% if link.pdf %}
          <a href="{{ link.pdf }}" class="btn-outline" target="_blank">PDF</a>
        {% endif %}
        {% if link.page %}
          <a href="{{ link.page }}" class="btn-outline" target="_blank">Project Page</a>
        {% endif %}
        {% if link.code %}
          <a href="{{ link.code }}" class="btn-outline" target="_blank">Code</a>
        {% endif %}
        {% if link.notes %}
          <span style="font-size: 13px; margin-left: 5px;"><i style="color:#e74d3c">{{ link.notes }}</i></span>
        {% endif %}
      </div>
    </div>
  </div>

{% endif %}
{% endfor %}
</div>

<h3 style="margin-top: 50px;">Co-Author</h3>
<div class="bibliography">
{% for link in site.data.publications.main %}
{% if link.authors contains "Shengbang Liu" %}
  {% unless link.authors contains "Shengbang Liu*" %}

  <div class="pub-row">
    <div class="pub-img-col">
      {% if link.image %}
        {% assign image_path = link.image | replace: './images/', '/images/' %}
        <img src="{{ image_path | prepend: base_path }}" class="teaser-img">
        {% if link.conference_short %}
          <span class="conf-badge">{{ link.conference_short }}</span>
        {% endif %}
      {% endif %}
    </div>

    <div class="pub-text-col">
      <div class="title">
        <a href="{{ link.pdf }}">{{ link.title }}</a>
      </div>
      <div class="author">{{ link.authors }}</div>
      <div class="periodical">
        {{ link.conference }}
      </div>

      <div class="links">
        {% if link.pdf %}
          <a href="{{ link.pdf }}" class="btn-outline" target="_blank">PDF</a>
        {% endif %}
        {% if link.page %}
          <a href="{{ link.page }}" class="btn-outline" target="_blank">Project Page</a>
        {% endif %}
        {% if link.code %}
          <a href="{{ link.code }}" class="btn-outline" target="_blank">Code</a>
        {% endif %}
        {% if link.notes %}
           <span style="font-size: 13px; margin-left: 5px;"><i style="color:#e74d3c">{{ link.notes }}</i></span>
        {% endif %}
      </div>
    </div>
  </div>

  {% endunless %}
{% endif %}
{% endfor %}
</div>

</div>