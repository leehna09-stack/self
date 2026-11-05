/* 색 조합 미리보기용: 주소 뒤에 ?palette=a|b|c 를 붙이면 그 조합으로 보이고 기억한다. (조합이 확정되면 이 파일은 삭제) */
(function () { try { var q = new URLSearchParams(location.search).get('palette'); if (q && /^[abc]$/.test(q)) localStorage.setItem('wedding-palette', q); var p = localStorage.getItem('wedding-palette'); if (p && /^[abc]$/.test(p)) document.documentElement.setAttribute('data-palette', p); } catch (e) {} })();
