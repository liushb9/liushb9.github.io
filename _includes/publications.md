{% assign lead_papers = site.data.publications.main | where: 'lead_author', true %}
{% assign coauthor_papers = site.data.publications.main | where: 'lead_author', false %}
<div class="publications">
  <div class="publication-group">
    <div class="publication-group__heading">
      <h3>First author / co-first author</h3>
      <span>{{ lead_papers.size }} papers</span>
    </div>
    {% for paper in lead_papers %}
      {% include research-publication.html paper=paper %}
    {% endfor %}
  </div>
  <div class="publication-group">
    <div class="publication-group__heading">
      <h3>Co-author</h3>
      <span>{{ coauthor_papers.size }} paper{% if coauthor_papers.size != 1 %}s{% endif %}</span>
    </div>
    {% for paper in coauthor_papers %}
      {% include research-publication.html paper=paper %}
    {% endfor %}
  </div>
  <p class="publication-note">* Equal contribution.</p>
</div>
