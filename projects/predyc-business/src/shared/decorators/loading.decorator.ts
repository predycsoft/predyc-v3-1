export function AfterOnInitResetLoading(target: Function) {
    // guarda una referencia al método original del ngOnInit
    const original = target.prototype.ngOnInit;
    // reemplaza el método original para incluir funcionalidad adicional
    target.prototype.ngOnInit = async function(...args: any[]) {
        // llama al método ngOnInit original si existe
        if (original && typeof original === 'function') {
            this.loaderService.setLoading(true)
            await original.apply(this, args);
            // cambia el valor de loading después de que se ha ejecutado el ngOnInit original
            this.loaderService.setLoading(false)
        }
        
    };
}
