class Cache
{
    #module = {};
    #length = 0;
    pointer = 0;

    get length()
    {
        return this.#length;
    };

    constructor(module, lightMode = false, argon2Enabled = true)
    {
        this.#module = module;

        var flags = 0;
        if(!lightMode) flags |= 4;
        if(argon2Enabled) flags |= 96;

        this.pointer = this.#module.ccall('randomx_alloc_cache', 'number', ['number'], [flags]);
        if(this.pointer === 0) throw new Error("Failed to allocate cache memory");
    };

    init(key)
    {
        this.#module.ccall('randomx_init_cache', null, ['number', 'array', 'number'], [this.pointer, key, key.byteLength]);
    };

    delete()
    {
        this.#module.ccall('randomx_release_cache', null, ['number'], [this.pointer]);
    };
};

class Dataset
{
    #module = {};
    #length = 0;
    pointer = 0;
    cache = null;

    get length()
    {
        return this.#length;
    };

    constructor(module, cache, lightMode = false, argon2Enabled = true)
    {
        this.#module = module ? module : cache.module;

        var flags = 0;
        if(!lightMode) flags |= 4;
        if(argon2Enabled) flags |= 96;

        this.pointer = this.#module.ccall('randomx_alloc_dataset', 'number', ['number'], [flags]);
        if(this.pointer === 0) throw new Error("Failed to allocate dataset memory");
        this.cache = cache;
    };

    init(startItem, itemCount)
    {
        this.#module.ccall('randomx_init_dataset', null, ['number', 'number', 'number', 'number'], [this.pointer, this.cache.pointer, startItem, itemCount]);
    };

    delete()
    {
        this.#module.ccall('randomx_release_dataset', null, ['number'], [this.pointer]);
    };
};

class VM
{
    #module = {};
    pointer = 0;
    #cache = null;
    #dataset = null;

    constructor(module, cache, dataset, lightMode = false, argon2Enabled = true)
    {
        this.#module = module ? module : (cache.module ? cache.module : dataset.module);

        var flags = 0;
        if(!lightMode) flags |= 4;
        if(argon2Enabled) flags |= 96;

        this.pointer = this.#module.ccall("randomx_create_vm", 'number', ['number', 'number', 'number'], [flags, cache.pointer, dataset.pointer]);
        if(this.pointer === 0) 
        {
            if((!(cache.pointer)) && (!(lightMode))) throw new Error('Invalid cache');
            if((!(dataset.pointer)) && (!(lightMode))) throw new Error('Invalid dataset');
            throw new Error('Failed to allocate VM');
        };

        this.#cache = cache;
        this.#dataset = dataset;
    };

    get cache()
    {
        return this.#cache;
    };

    get dataset()
    {
        return this.#dataset;
    };

    set cache(v)
    {
        this.#module.ccall("randomx_vm_set_cache", null, ['number', 'number'], [this.pointer, v.pointer]);
    };

    set dataset(v)
    {
        this.#module.ccall("randomx_vm_set_dataset", null, ['number', 'number'], [this.pointer, v.pointer]);
    };

    delete()
    {
        this.#module.ccall('randomx_destroy_vm', null, ['number'], [this.pointer]);
    };

    calculateHash(data)
    {
        const output = this.#module._malloc(32);
        const dataIn = this.#module._malloc(data.byteLength);
        this.#module.HEAP8.set(data, dataIn);
        this.#module.ccall('randomx_calculate_hash', null, ['number', 'number', 'number', 'number'], [this.pointer, dataIn, data.byteLength, output]); 
        this.#module._free(dataIn);
        const result = this.#module.HEAP8.slice(output, output+32);
        this.#module._free(output);
        return result;
    };

    calculateFirstHash(data)
    {
        const dataIn = this.#module._malloc(data.byteLength);
        this.#module.HEAP8.set(data, dataIn);
        this.#module.ccall('randomx_calculate_hash_first', null, ['number', 'number', 'number'], [this.pointer, dataIn, data.byteLength]);
        this.#module._free(dataIn);
    };

    calculateNextHash(data)
    {
        const output = this.#module._malloc(32);
        const dataIn = this.#module._malloc(data.byteLength);
        this.#module.HEAP8.set(data, dataIn);
        this.#module.ccall('randomx_calculate_hash_next', null, ['number', 'number', 'number', 'number'], [this.#module, dataIn, data.byteLength, output]);
        this.#module._free(dataIn);
        const result = this.#module.HEAP8.slice(output, output+32);
        this.#module._free(output);
        return result;
    };

    calculatePrevHash()
    {
        const output = this.#module._malloc(32);
        this.#module.ccall('randomx_calculate_hash_next', null, ['number', 'number'], [this.#module, output]);
        const result = this.#module.HEAP8.slice(output, output+32);
        this.#module._free(output);
        return result;
    };
};
