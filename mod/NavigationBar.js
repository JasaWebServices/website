var
router=require('po/router'),
toggleMenu=function(btn,menu,bar,overlay){
	var cl=btn.classList
	menu.parentElement.removeChild(menu)
	cl.toggle('w--open')
	if(cl.contains('w--open')){
		overlay.setAttribute('style','display: block; height: 2573px; width: 200px;')
		menu.classList.add('w--nav-menu-open')
		overlay.appendChild(menu)
		menu.setAttribute('style','transform: translateX(0px) translateY(0px); height: 2573px; transition: transform 400ms;')
	}else{
		overlay.setAttribute('style','display: none;')
		menu.classList.remove('w--nav-menu-open')
		bar.appendChild(menu)
		menu.setAttribute('style','transform: translateX(0px) translateY(0px);')
	}
}

return {
	deps:{
		brand:'list', // short, full
		collapse:['text','medium'], // all,medium,small,tiny
		animation:['text','over-right'], // over-left,over-right
		duration:['int',300], 
		contain:['bool',1], 
		navLinks:'map' // Name, url
	},
	create:function(deps,params){
		this.super.create.call(this,deps,params)

		var
		el=this.el,
		ds=el.dataset,
		dom=__.dom,
		container=el.querySelector('.w-container'),
		overlay=el.querySelector('.w-nav-overlay'),
		brand=container.querySelector('.brand-link'),
		content=[]

		ds.collapse=deps.collapse
		ds.animation=deps.animation
		ds.duration=deps.duration
		ds.contain=deps.contain

		dom.get({
			el:brand,
			content:[
				{
					tagName:'h1',
					className:'w-hidden-main w-hidden-medium w-hidden-small brand-text',
					content:deps.brand[0]
				},
				{
					tagName:'h1',
					className:'w-hidden-tiny brand-text',
					content:deps.brand[1]||deps.brand[0]
				}
			]
		})

		for(var link in deps.navLinks){
			content.push({
				tagName:'a',
				className:'w-nav-link navigation-link',
				style:'max-width: 940px;',
				content:link
			})
		}

		container.appendChild(dom.get({
			tagName:'nav',
			className:'w-nav-menu navigation-menu',
			role:'navigation',
			content:content
		}))
	},
	events:{
		'click .brand-link':function(e, target){
			router.go()
		},
		'click .navigation-link':function(e, target){
			router.go(this.deps.navLinks[target.textContent])
			var el=this.el
			var nmenu=el.querySelector('.navigation-menu')
			nmenu.querySelectorAll('.navigation-link').forEach(link=>{
				link.classList.remove('w--current')
			})
			target.classList.add('w--current')

			if (!target.closest('.w-nav-overlay')) return
			
			toggleMenu(
				el.querySelector('.hamburger-button'),
				nmenu,
				el.querySelector('.w-container'),
				el.querySelector('.w-nav-overlay'))
		},
		'click .hamburger-button':function(e, target){
			var el=this.el
			
			toggleMenu(
				target,
				el.querySelector('.navigation-menu'),
				el.querySelector('.w-container'),
				el.querySelector('.w-nav-overlay'))
		},
		'click .navigation-bar':function(e){
			e.stopPropagation()
		},
		'CLICK html':function(e, target){
			var
			el=this.el,
			btn=el.querySelector('.hamburger-button'),
			cl=btn.classList
			
			cl.contains('w--open') && toggleMenu(
				el.querySelector('.hamburger-button'),
				el.querySelector('.navigation-menu'),
				el.querySelector('.w-container'),
				el.querySelector('.w-nav-overlay'))
		}
	}
}
