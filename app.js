const toast = document.querySelector('#toast');
const modal = document.querySelector('#postModal');
const authModal = document.querySelector('#authModal');
const detailsModal = document.querySelector('#detailsModal');
const eventGrid = document.querySelector('#eventGrid');
const authForm = document.querySelector('#authForm');
let authMode = 'login';
let authToken = localStorage.getItem('eventNestToken') || localStorage.getItem('ooroliToken');
if (authToken) localStorage.setItem('eventNestToken', authToken);
const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiBase = window.location.protocol === 'file:' || (localHost && window.location.port !== '3000') ? 'http://localhost:3000' : '';
const api = (path, options = {}) => fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(options.headers || {}) } });
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; document.querySelector('#installButton').hidden = false; });
document.querySelector('#installButton').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; document.querySelector('#installButton').hidden = true; });
window.addEventListener('appinstalled', () => { document.querySelector('#installButton').hidden = true; showToast('Event Nest installed successfully'); });
if (authToken) api('/api/auth/me').then(response => response.ok ? response.json() : null).then(result => { if (result?.user) document.querySelector('#profileName').textContent = result.user.name; }).catch(() => {});
function showToast(message){toast.textContent=message;toast.classList.add('show');window.setTimeout(()=>toast.classList.remove('show'),2800)}
const localDetails = {
	'Community lake clean-up': { type: 'Event', description: 'Join neighbors for a community lake clean-up at Big Lake.', author: 'Ooroli Team' },
	'Power outage update': { type: 'Announcement', description: 'Scheduled maintenance is planned for tomorrow from 9:00 AM to 12:00 PM.', author: 'Ooroli Team' },
	'Support for senior home': { type: 'Help', description: 'Medicine and food supplies are needed for the senior home.', author: 'Ooroli Team' }
};
function showDetails(title, details){
	document.querySelector('#detailsType').textContent=details.type;
	document.querySelector('#detailsTitle').textContent=title;
	document.querySelector('#detailsDescription').textContent=details.description;
	document.querySelector('#detailsAuthor').textContent=`Posted by ${details.author}`;
	if (typeof detailsModal.showModal === 'function') detailsModal.showModal();
	else { detailsModal.setAttribute('open', ''); detailsModal.classList.add('show'); }
}
document.querySelector('#shareButton').addEventListener('click',async()=>{if(navigator.share)await navigator.share({title:'Event Nest',text:'See what is happening in our neighborhood on Event Nest.'});else{await navigator.clipboard?.writeText(window.location.href);showToast('Link copied to clipboard')}});
document.querySelector('#filterButton').addEventListener('click',event=>{const options=['All','News','Company','Event','Announcement','Help'];const current=event.currentTarget.dataset.filter||'All';const next=options[(options.indexOf(current)+1)%options.length];event.currentTarget.dataset.filter=next;event.currentTarget.firstChild.textContent=next+' ';document.querySelectorAll('.event-card').forEach(card=>{card.hidden=next!=='All'&&card.dataset.type!==next})});
document.querySelector('#eventSearch').addEventListener('submit',async event=>{event.preventDefault();const values=new FormData(event.currentTarget);const query=new URLSearchParams({q:values.get('q'),city:values.get('city')});try{const response=await api(`/api/events/search?${query}`);const result=await response.json();if(!response.ok){showToast(result.error);return}if(!result.events.length){showToast('No live events found for that search');return}eventGrid.innerHTML=result.events.map(item=>`<article class="event-card live-event" data-type="Event"><div class="card-icon orange">★</div><div><span class="tag green">Live event · ${escapeHtml(item.city)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.date)} ${escapeHtml(item.time)} · ${escapeHtml(item.venue)}</p><a class="card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open event page <span>↗</span></a></div></article>`).join('');showToast(`${result.events.length} real events found via ${result.source}`)}catch{showToast('Backend is not running. Start it at http://localhost:3000')}});
eventGrid.addEventListener('click',event=>{const button=event.target.closest('button.card-link');if(!button)return;const title=button.dataset.event;if(title)showDetails(title,localDetails[title]||{type:'Community update',description:'Event details are available here.',author:'Event Nest'})});
document.querySelector('#openModal').addEventListener('click',()=>modal.showModal());
document.querySelector('#postModal .close-button').addEventListener('click',event=>{event.preventDefault();modal.close()});
document.querySelector('#postForm').addEventListener('submit',async event=>{event.preventDefault();if(!authToken){modal.close();authModal.showModal();showToast('Please log in to publish a post');return}const data=Object.fromEntries(new FormData(event.currentTarget));const response=await api('/api/posts',{method:'POST',body:JSON.stringify(data)});const result=await response.json();if(!response.ok){showToast(result.error);return}const card=document.createElement('article');card.className='event-card';card.dataset.type=result.post.type;card.innerHTML=`<div class="card-icon blue">✦</div><div><span class="tag blue-tag">${escapeHtml(result.post.type)}</span><h3>${escapeHtml(result.post.title)}</h3><p>${escapeHtml(result.post.event_date || '')} ${escapeHtml(result.post.event_time || '')} · ${escapeHtml(result.post.place)}</p><small>${escapeHtml(result.post.description)}</small></div>`;eventGrid.prepend(card);modal.close();event.currentTarget.reset();showToast('Your post has been published permanently')});
document.querySelector('#profileButton').addEventListener('click',()=>{if(authToken){localStorage.removeItem('eventNestToken');localStorage.removeItem('ooroliToken');authToken=null;document.querySelector('#profileName').textContent='Log in';showToast('You have been logged out')}else authModal.showModal()});
document.querySelector('#authModal .close-button').addEventListener('click',event=>{event.preventDefault();authModal.close()});
document.querySelector('#detailsModal .close-button').addEventListener('click',event=>{event.preventDefault();detailsModal.close()});
document.querySelector('#switchAuth').addEventListener('click',()=>{authMode=authMode==='login'?'register':'login';document.querySelector('#authTitle').textContent=authMode==='login'?'Log in':'Create account';document.querySelector('#authSubmit').firstChild.textContent=authMode==='login'?'Log in ':'Create account ';document.querySelector('#switchAuth').textContent=authMode==='login'?'Create a new account':'Already have an account? Log in';document.querySelector('#nameField').hidden=authMode==='login'});
authForm.addEventListener('submit',async event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));const response=await api(`/api/auth/${authMode}`,{method:'POST',body:JSON.stringify(data)});const result=await response.json();if(!response.ok){showToast(result.error);return}authToken=result.token;localStorage.setItem('eventNestToken',authToken);document.querySelector('#profileName').textContent=result.user.name;authModal.close();event.currentTarget.reset();showToast(authMode==='login'?'Welcome back!':'Account created successfully')});

async function loadUpcomingEvents(){
	try{
		const response=await api('/api/events/search');
		if(!response.ok)return;
		const result=await response.json();
		if(!result.events.length)return;
		eventGrid.innerHTML=result.events.map(item=>`<article class="event-card live-event" data-type="Event"><div class="card-icon orange">★</div><div><span class="tag green">Live event · ${escapeHtml(item.city)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.date)}${item.time?` · ${escapeHtml(item.time)}`:''} · ${escapeHtml(item.venue)}</p><a class="card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open event page <span>↗</span></a></div></article>`).join('');
	}catch{
		// Keep the local fallback cards visible when the live provider is unavailable.
	}
}
async function loadDailyNews(){
	try{
		const response=await api('/api/news?q=community+India');
		if(!response.ok)return;
		const result=await response.json();
		const cards=result.items.map(item=>`<article class="event-card live-event" data-type="News"><div class="card-icon orange">N</div><div><span class="tag orange-tag">Daily news</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.date)}</p><a class="card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Read full news <span>↗</span></a></div></article>`).join('');
		if(cards)eventGrid.insertAdjacentHTML('afterbegin',cards);
	}catch{}
}
loadUpcomingEvents().finally(loadDailyNews);
