<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>MITS LMS | XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px 16px;
          }
          
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.04);
          }
          
          .header {
            display: flex;
            flex-direction: column;
            gap: 16px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          
          @media (min-width: 640px) {
            .header {
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
            }
          }
          
          .title-area h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 26px;
            font-weight: 800;
            margin: 0;
            color: #0f172a;
            background: linear-gradient(135deg, #0052cc, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .title-area p {
            font-size: 13px;
            color: #64748b;
            margin: 6px 0 0 0;
            line-height: 1.5;
          }
          
          .stats {
            display: flex;
            gap: 12px;
          }
          
          .stat-card {
            background: #f8fafc;
            border-radius: 14px;
            padding: 10px 20px;
            text-align: center;
            border: 1px solid #f1f5f9;
          }
          
          .stat-card strong {
            display: block;
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #0052cc;
          }
          
          .stat-card span {
            font-size: 10px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          
          th {
            background: #f8fafc;
            color: #64748b;
            font-weight: 700;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
            word-break: break-all;
          }
          
          tr:hover td {
            background: #f8fafc/50;
            color: #0f172a;
          }
          
          a {
            color: #0052cc;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.15s ease;
          }
          
          a:hover {
            color: #4f46e5;
            text-decoration: underline;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
          }
          
          .badge-high {
            background: #ecfdf5;
            color: #065f46;
          }
          
          .badge-med {
            background: #eff6ff;
            color: #1e40af;
          }
          
          .footer {
            margin-top: 32px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title-area">
              <h1>XML Search Engine Sitemap</h1>
              <p>Madanapalle Institute of Technology &amp; Science (MITS) Learning Management System</p>
            </div>
            <div class="stats">
              <div class="stat-card">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
                <span>Total URLs</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="65%">Location (URL)</th>
                <th width="20%">Change Frequency</th>
                <th width="15%">Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td style="text-transform: capitalize;">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:variable name="prio">
                      <xsl:value-of select="sitemap:priority"/>
                    </xsl:variable>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:choose>
                          <xsl:when test="$prio &gt;= 0.9">badge badge-high</xsl:when>
                          <xsl:otherwise>badge badge-med</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            Designed and managed by Ethnotech Academic Solutions. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
