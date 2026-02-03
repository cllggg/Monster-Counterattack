import asyncio
from database import AsyncSessionLocal, engine
import db_models
from sqlalchemy.future import select
import uuid

ARTICLE_DATA_LIST = [
    {
        "title": "小狮子的第一声吼叫",
        "difficulty": 1,
        "author": "童话大师",
        "content": [
            {
                "id": 1,
                "content": "在一个金色的草原上，住着一只叫小辛的小狮子。他是狮群里最害羞的孩子。当其他的狮子练习吼叫时，小辛总是躲在妈妈身后。",
                "task": "小辛是一个什么样的狮子？",
                "answer": "害羞|胆小|内向"
            },
            {
                "id": 2,
                "content": "直到有一天，一只调皮的小猴子掉进了泥潭里。小猴子大声呼救，但狮群的大狮子们都在远处捕猎。只有小辛听到了。",
                "task": "发生了什么意外情况？",
                "answer": "猴子|掉进|泥潭|呼救"
            },
            {
                "id": 3,
                "content": "小辛跑向泥潭，他想叫人帮忙，但他太小了。他闭上眼睛，深深吸了一口气，发出了他生命中第一声真正的吼叫。那声音响彻草原，引来了大狮子们。",
                "task": "小辛最后是怎么做的？",
                "answer": "吼叫|大叫|呼喊"
            }
        ],
        "puzzle_segments": [
            {"id": "1", "content": "小辛是狮群里最害羞的孩子。"},
            {"id": "2", "content": "小猴子掉进了泥潭大声呼救。"},
            {"id": "3", "content": "小辛发出了生命中第一声吼叫。"},
            {"id": "4", "content": "大狮子们听到声音赶来帮忙。"}
        ]
    },
    {
        "title": "小马过河",
        "difficulty": 1,
        "author": "寓言故事",
        "content": [
            {
                "id": 1,
                "content": "马棚里住着一匹小马。有一天，妈妈对小马说：“你已经长大了，能帮妈妈做点事吗？”小马连蹦带跳地说：“怎么不能？我最愿意帮您做事了。”妈妈高兴地说：“那好哇，你把这半口袋麦子驮到磨坊去吧。”",
                "task": "小马对帮妈妈做事是什么态度？",
                "answer": "愿意|高兴|连蹦带跳"
            },
            {
                "id": 2,
                "content": "小马驮起麦子，飞快地往磨坊跑去。跑着跑着，一条小河挡住了去路。小马为难了，心想：我能不能过去呢？如果妈妈在身边，问问她该怎么办，那多好哇！",
                "task": "小马遇到河时想到了谁？",
                "answer": "妈妈|母亲"
            },
            {
                "id": 3,
                "content": "他向四周望望，看见一头老牛在河边吃草。小马嗒嗒嗒跑过去，问道：“牛伯伯，请您告诉我，这条河，我能趟过去吗？”老牛说：“水很浅，刚没小腿，能趟过去。”",
                "task": "老牛认为河水深还是浅？",
                "answer": "浅|刚没小腿"
            },
            {
                "id": 4,
                "content": "小马听了老牛的话，立刻跑到河边。突然，从树上跳下一只松鼠，拦住他大叫：“小马！别过河，别过河，你会淹死的！”松鼠认真地说：“深得很哩！昨天，我的一个伙伴就是掉在这条河里淹死的！”",
                "task": "松鼠为什么拦住小马？",
                "answer": "深|会淹死|伙伴淹死"
            },
            {
                "id": 5,
                "content": "小马连忙收住脚步，不知道怎么办才好。他叹了口气，说：“唉！还是回家问问妈妈吧！”小马甩甩尾巴，跑回家去。",
                "task": "小马最后决定怎么办？",
                "answer": "回家|问妈妈"
            }
        ],
        "puzzle_segments": [
            {"id": "1", "content": "小马帮妈妈驮麦子去磨坊。"},
            {"id": "2", "content": "老牛说水很浅，松鼠说水很深。"},
            {"id": "3", "content": "小马回家问妈妈该怎么办。"},
            {"id": "4", "content": "小马亲自下河，发现水不深也不浅。"}
        ]
    },
    {
        "title": "掩耳盗铃",
        "difficulty": 2,
        "author": "吕氏春秋",
        "content": [
            {
                "id": 1,
                "content": "春秋时期，晋国的大将军智伯灭掉了范氏。范氏逃亡后，有一个人想趁机偷走范氏家里的一口大钟。",
                "task": "这个人想偷走什么？",
                "answer": "大钟|钟"
            },
            {
                "id": 2,
                "content": "这口钟是用上等的青铜铸成的，造型优美，声音宏亮。小偷心里非常喜欢，想把它背回家去。可是，这口钟又大又重，根本背不动。",
                "task": "小偷遇到了什么困难？",
                "answer": "重|背不动"
            },
            {
                "id": 3,
                "content": "小偷想出了一个主意：如果把钟敲碎，不就可以分块背回家了吗？于是，他找来一把大铁锤，拼命向大钟砸去。",
                "task": "小偷的主意是什么？",
                "answer": "敲碎|砸碎|分块"
            },
            {
                "id": 4,
                "content": "“当——”的一声巨响，把小偷吓了一大跳。他心想：这响声这么大，要是让别人听见，不就把我抓住了吗？",
                "task": "小偷砸钟后担心什么？",
                "answer": "响声|被抓住|被发现"
            },
            {
                "id": 5,
                "content": "他急忙伸出双手，紧紧捂住自己的耳朵。他心想：只要我听不见，别人也就听不到了。于是，他放心地砸起钟来。",
                "task": "小偷是怎么解决“声音太大”这个问题的？",
                "answer": "捂住耳朵|塞住耳朵"
            }
        ],
        "puzzle_segments": [
            {"id": "1", "content": "小偷看中了范氏家的大钟。"},
            {"id": "2", "content": "小偷发现钟太重背不动，决定砸碎。"},
            {"id": "3", "content": "砸钟的声音太大，小偷害怕被人发现。"},
            {"id": "4", "content": "小偷捂住自己的耳朵继续砸钟。"}
        ]
    }
]

async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(db_models.Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for data in ARTICLE_DATA_LIST:
            # Check if exists
            result = await session.execute(
                select(db_models.ReadingArticle).where(db_models.ReadingArticle.title == data["title"])
            )
            existing = result.scalars().first()
            
            if not existing:
                article = db_models.ReadingArticle(
                    id=uuid.uuid4().hex,
                    title=data["title"],
                    author=data["author"],
                    difficulty=data["difficulty"],
                    content=data["content"],
                    puzzle_segments=data.get("puzzle_segments")
                )
                session.add(article)
                print(f"Prepared article: {article.title}")
            else:
                print(f"Article '{data['title']}' already exists.")
        
        await session.commit()
        print("Seed completed.")

if __name__ == "__main__":
    asyncio.run(seed())
