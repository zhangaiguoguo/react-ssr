(function (self, fn) {
  self.apiScript = fn();
})(window, function () {
  async function addJmreportDict(options) {
    const params = new URLSearchParams(location.search);
    const { customPrePath } = JSON.parse(reportConfigString);
    const token =
      params.get("token") || localStorage.getItem("JmReport-Access-Token");
    const headers = new Headers();
    headers.append("Token", token);
    headers.append("Content-Type", "application/json");
    const result = await (
      await fetch(api?.dictAdd || customPrePath + "/jmreport/dict/add", {
        method: "post",
        body: JSON.stringify({
          description: options.description,
          dictCode: options.dictCode,
          dictName: options.dictName,
        }),
        headers: headers,
      })
    ).json();
    if (result.code !== 200 && result.code !== 0) {
      return addJmreportDict(options);
    }
    let refleshCacheCount = 5;
    while (true) {
      const rows = (
        await (
          await fetch(
            (api?.dictList || customPrePath + "/jmreport/dict/list") +
              "?pageNo=1&pageSize=99999999",
            {
              headers: headers,
            }
          )
        ).json()
      ).result.records;
      const findRow = rows.find(
        (ii) =>
          ii.dictCode == options.dictCode || ii.dictName == options.dictName
      );
      if (findRow) {
        await Promise.all(
          options.list.map((ii) => {
            return fetch(
              api?.dictItemAdd || customPrePath + "/jmreport/dictItem/add",
              {
                body: JSON.stringify({
                  ...ii,
                  dictId: findRow.id,
                }),
                headers,
                method: "post",
              }
            ).then((r) => r.json());
          })
        );
        break;
      } else {
        if (!refleshCacheCount)
          return Promise.reject("找不到" + options.dictCode + "类型的字典");
        refleshCacheCount--;
        (
          await fetch(
            api?.refleshCache || customPrePath + "/jmreport/dict/refleshCache",
            {
              headers,
            }
          )
        ).json();
      }
    }
  }

  function patch(options) {
    if (Array.isArray(options)) {
      const dict = options[0];
      const dictList = options[1];
      options = {
        dictCode: dict[1],
        dictName: dict[0],
        description: dict[2],
        list: dictList,
      };
    }
    options.list = (options.list ?? []).map((ii, order) => {
      if (!Array.isArray(ii)) {
        ii.sortOrder ??= order;
        ii.status ??= 1;
        return ii;
      }
      return {
        itemText: ii[0],
        itemValue: ii[1],
        sortOrder: order,
        description: ii[3],
        status: ii[4] ?? 1,
      };
    });
    return addJmreportDict(options);
  }

  const ui = iview;
  const ModalScript = Vue.extend({
    components: [ui.Modal, ui.Button, ui.Row, ui.Input],
    template: `
        <div>
            <Modal title="新增字典" width="420" v-model="modalValue">
                <Row>
                    <Input v-model="valText" type="textarea" :rows="4" placeholder="请输入json格式"/>
                </Row>
                <template #footer>
                    <Row>
                        <Button @click="parasJson">解析json</Button>
                        <Button type="primary" :loading="loading" @click="submit">确认</Button>
                    </Row>
                </template>
            </Modal>
        </div>
      `,
    data() {
      return {
        valText: "",
        modalValue: false,
        loading: false,
      };
    },
    methods: {
      parasJson() {
        let l;
        if (!this.valText || !(l = this.valText.trim())) {
          this.$Message.warning("请输入内容");
          return;
        }
        try {
          return JSON.parse(l);
        } catch (e) {
          this.$Message.error("解析失败 error: " + e.message);
        }
      },
      async submit() {
        let list = this.parasJson();
        if (list) {
          try {
            this.loading = true;
            if (Array.isArray(list)) {
              if (list[0].length === 2 && Array.isArray(list[0][0])) {
              } else {
                list = [list];
              }
            } else {
              list = [list];
            }
            return await Promise.all(list.map((ii) => patch(ii)))
              .then((r) => r)
              .catch((r) => {
                this.$Message.error(r?.message || String(r).toString());
              });
          } finally {
            this.loading = false;
          }
        }
      },
      open() {
        this.valText = null;
        this.modalValue = true;
      },
      close() {
        this.modalValue = false;
      },
    },
  });

  const FixedOpenScriptButton = Vue.extend({
    components: [ui.Button, ui.Row],
    template: `
        <div ref="elRef" :style="{zIndex:\`\${Date.now()}\${Date.now()}\`,position:'fixed',right:hoverFlag ? 0 : '-20px',top:'50%'}">
            <Row style="marginBottom:12px;" v-if="hoverFlag">
                <Button type="primary" @click="openModalHandler">打开脚本弹窗</Button>
            </Row>
            <Row justify="end" type="flex">
                <Button title="打开脚本工具" @click="hoverFlag = !hoverFlag" shape="circle" >
                    <Icon type="ios-arrow-forward" v-if="!hoverFlag"/>
                    <Icon type="ios-arrow-back" v-else/>
                </Button>
            </Row>
        </div>
    `,
    data() {
      return {
        hoverFlag: false,
      };
    },
    methods: {
      openModalHandler() {
        this.hoverFlag = false;
        modelAppContext.app.openModalHandler();
      },
    },
  });

  function createModalApp() {
    const div = document.createElement("div");
    div.id = Date.now() + "_app_script";
    document.body.appendChild(div);
    const ctx = new Vue({
      render(h) {
        return h("div", [
          h(ModalScript, { ref: "appRef" }),
          [h(FixedOpenScriptButton, {})],
        ]);
      },
      methods: {
        openModalHandler() {
          this.$refs.appRef.open();
        },
        closeModalHandler() {
          this.$refs.appRef.close();
        },
      },
    });

    ctx.$mount(div);

    return {
      app: ctx,
    };
  }

  let modelAppContext = null;

  Promise.resolve().then(() => {
    modelAppContext = createModalApp();
  });

  const TIPTEXT = `// 输入框 json格式 以下方式

  1 a = [
    /*字典信息*/
    [
      /*dictCode*/ "sample_type",
      /*dictName*/ "样品编号",
      /*description*/ "xxx",
    ],
    /*字典选项信息*/
    [
      [
        /*itemText*/ "A",
        /*itemValue*/ "1",
        /*description*/ "xxx",
        /*status*/ 1,
      ],
      //...
    ],
  ];

  2 [a,/*...a*/]

  3 b = {
    /*字典信息*/
    dictCode: "xxx",
    dictName: "xxx",
    description: "xxx",
    /*字典选项信息*/
    list: [
      [
        /*itemText*/ "A",
        /*itemValue*/ "1",
        /*description*/ "xxx",
        /*status*/ 1,
      ],
      //...
    ],
  }

  4 [b,/*...b*/]
  `;

  console.log(TIPTEXT)

  return {
    addDict: patch,
    createModalApp,
    openModalHandler() {
      modelAppContext.app.openModalHandler();
    },
    closeModalHandler() {
      modelAppContext.app.closeModalHandler();
    },
  };
});
