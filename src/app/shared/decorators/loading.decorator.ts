export function AfterOnInitResetLoading(target: Function) {
    // guarda una referencia al método original del ngOnInit
    const original = target.prototype.ngOnInit;
    // reemplaza el método original para incluir funcionalidad adicional
    target.prototype.ngOnInit = function(...args: any[]) {
        // llama al método ngOnInit original si existe
        if (original && typeof original === 'function') {
            original.apply(this, args);
        }
        // cambia el valor de loading después de que se ha ejecutado el ngOnInit original
        console.log("Decorador")
        setTimeout(() => {  
            // recordar declarar private loaderService: LoaderService en el componente
            this.loaderService.setLoading(false)
        }, 1000);
        
    };
}
