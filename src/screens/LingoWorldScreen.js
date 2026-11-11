import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speak } from "../utils/speech";
import { worldLocations } from "../data/lingoWorld";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { gradeAnswer } from "../utils/answer";
import { balancedOptions } from "../utils/shuffle";
import { expandExplanation } from "../utils/explanations";

const homeShop = [
  {
    id: "desk",
    emoji: "🪑",
    title: "Учебный стол",
    detail: "Уголок для занятий",
    cost: 35,
  },
  {
    id: "bookshelf",
    emoji: "📚",
    title: "Книжная полка",
    detail: "Домашняя библиотека",
    cost: 50,
  },
  {
    id: "plant",
    emoji: "🪴",
    title: "Большое растение",
    detail: "Больше уюта",
    cost: 25,
  },
  {
    id: "record-player",
    emoji: "🎵",
    title: "Проигрыватель",
    detail: "Английская музыка",
    cost: 70,
  },
  {
    id: "london-view",
    emoji: "🌆",
    title: "Вид на Лондон",
    detail: "Редкое улучшение",
    cost: 120,
  },
];

const worldEvents = [
  {
    id: "lost-tourist",
    emoji: "🗺️",
    title: "Заблудившийся турист",
    prompt: "Как вежливо показать дорогу?",
    answer: "Go straight and turn left at the traffic lights.",
    options: [
      "Turn somewhere left.",
      "Go straight and turn left at the traffic lights.",
      "You need another street.",
    ],
    reward: 15,
  },
  {
    id: "neighbour-parcel",
    emoji: "📦",
    title: "Посылка соседа",
    prompt: "Скажи, что сохранишь посылку до вечера",
    answer: "I'll keep it safe until this evening.",
    options: [
      "I keep it in evening.",
      "It will be here maybe.",
      "I'll keep it safe until this evening.",
    ],
    reward: 12,
  },
  {
    id: "cafe-review",
    emoji: "⭐",
    title: "Отзыв о кафе",
    prompt: "Выбери естественный комплимент",
    answer: "The service was excellent and the staff were welcoming.",
    options: [
      "Service made good feelings.",
      "The service was excellent and the staff were welcoming.",
      "Workers are not bad.",
    ],
    reward: 18,
  },
  {
    id: "work-message",
    emoji: "✉️",
    title: "Срочное сообщение",
    prompt: "Как сообщить о небольшой задержке?",
    answer: "I'm running slightly late, but I'll be there in ten minutes.",
    options: [
      "I late, wait me.",
      "I'm running slightly late, but I'll be there in ten minutes.",
      "Maybe I come later.",
    ],
    reward: 20,
  },
  {
    id: "museum-help",
    emoji: "🏛️",
    title: "Разговор в музее",
    prompt: "Уточни время закрытия",
    answer: "What time does the museum close?",
    options: [
      "When museum is closing time?",
      "What time does the museum close?",
      "Museum closes where?",
    ],
    reward: 14,
  },
];

function Header({ title, onClose, right }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onClose} style={s.back}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={s.headerRight}>{right}</View>
    </View>
  );
}

export default function LingoWorldScreen({ onClose }) {
  const { progress } = useProgress();
  const [location, setLocation] = useState(null);
  const [tab, setTab] = useState("map");
  const completed = progress.world?.completed || [];
  const stars = progress.world?.stars || {};
  const inventory = progress.world?.inventory || [];
  const unlockedCount = Math.min(worldLocations.length, completed.length + 1);

  if (location)
    return (
      <WorldMission location={location} onBack={() => setLocation(null)} />
    );

  if (tab === "phone")
    return (
      <View style={s.container}>
        <Header
          title="Английская жизнь"
          onClose={onClose}
          right={<Text style={s.money}>£{progress.world?.money ?? 150}</Text>}
        />
        <WorldTabs tab={tab} setTab={setTab} />
        <PhoneTab world={progress.world || {}} />
      </View>
    );
  if (tab === "home")
    return (
      <View style={s.container}>
        <Header
          title="Английская жизнь"
          onClose={onClose}
          right={<Text style={s.money}>£{progress.world?.money ?? 150}</Text>}
        />
        <WorldTabs tab={tab} setTab={setTab} />
        <HomeTab world={progress.world || {}} />
      </View>
    );
  if (tab === "passport")
    return (
      <View style={s.container}>
        <Header
          title="Английская жизнь"
          onClose={onClose}
          right={<Text style={s.money}>£{progress.world?.money ?? 150}</Text>}
        />
        <WorldTabs tab={tab} setTab={setTab} />
        <PassportTab world={progress.world || {}} />
      </View>
    );

  return (
    <View style={s.container}>
      <Header
        title="Английская жизнь"
        onClose={onClose}
        right={<Text style={s.money}>£{progress.world?.money ?? 150}</Text>}
      />
      <WorldTabs tab={tab} setTab={setTab} />
      <ScrollView contentContainerStyle={s.mapContent}>
        <View style={s.worldHero}>
          <Text style={s.worldEmoji}>🌍</Text>
          <Text style={s.worldTitle}>Твоя история в Лондоне</Text>
          <Text style={s.worldText}>
            Живые ситуации, свободные ответы и путь от первого прилёта до
            выступления на конференции
          </Text>
          <ProgressBar
            value={completed.length / worldLocations.length}
            color={colors.mint}
          />
        </View>

        {!!inventory.length && (
          <View>
            <Text style={s.section}>ТВОЙ ИНВЕНТАРЬ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.inventory}
            >
              {inventory.map((item) => (
                <View key={item.id} style={s.inventoryItem}>
                  <Text style={s.inventoryEmoji}>{item.emoji}</Text>
                  <Text style={s.inventoryTitle}>{item.title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={s.section}>КАРТА ИСТОРИИ · A1–C1</Text>
        {worldLocations.map((item, index) => {
          const done = completed.includes(item.id);
          const unlocked = index < unlockedCount || done;
          return (
            <View key={item.id} style={s.pathRow}>
              <View style={s.pathRail}>
                <View
                  style={[
                    s.pathDot,
                    {
                      backgroundColor: unlocked ? item.color : colors.cardLight,
                    },
                  ]}
                />
                {index < worldLocations.length - 1 && (
                  <View
                    style={[
                      s.pathLine,
                      done && { backgroundColor: item.color },
                    ]}
                  />
                )}
              </View>
              <Pressable
                disabled={!unlocked}
                onPress={() => setLocation(item)}
                style={[
                  s.location,
                  !unlocked && s.lockedLocation,
                  { borderColor: unlocked ? `${item.color}55` : colors.border },
                ]}
              >
                <View
                  style={[
                    s.locationIcon,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Text style={s.locationEmoji}>
                    {unlocked ? item.emoji : "🔒"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.locationTop}>
                    <Text style={[s.level, { color: item.color }]}>
                      {item.level} · ГЛАВА {item.order}
                    </Text>
                    {done && (
                      <Text style={s.stars}>
                        {"⭐".repeat(stars[item.id] || 1)}
                      </Text>
                    )}
                  </View>
                  <Text style={s.locationTitle}>{item.title}</Text>
                  <Text style={s.locationText}>
                    {unlocked ? item.subtitle : "Заверши предыдущую главу"}
                  </Text>
                </View>
                {unlocked && (
                  <Ionicons
                    name={done ? "refresh" : "play"}
                    size={20}
                    color={item.color}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function WorldTabs({ tab, setTab }) {
  const tabs = [
    ["map", "map", "Карта"],
    ["phone", "chatbubble-ellipses", "Телефон"],
    ["home", "home", "Дом"],
    ["passport", "ribbon", "Паспорт"],
  ];
  return (
    <View style={s.worldTabs}>
      {tabs.map(([id, icon, label]) => (
        <Pressable
          key={id}
          onPress={() => setTab(id)}
          style={[s.worldTab, tab === id && s.worldTabActive]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={tab === id ? "white" : colors.textMuted}
          />
          <Text style={[s.worldTabText, tab === id && { color: "white" }]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PhoneTab({ world }) {
  const { completeWorldEvent, replyWorldMessage } = useProgress();
  const [eventAnswer, setEventAnswer] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const messages = world.messages || [];
  const relationships = Object.entries(world.relationships || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const today = new Date().toISOString().slice(0, 10);
  const daySeed = Number(today.replaceAll("-", ""));
  const dailyEvent = worldEvents[daySeed % worldEvents.length];
  const eventKey = `${today}-${dailyEvent.id}`;
  const savedEvent = world.events?.[eventKey];
  const eventOptions = useMemo(
    () =>
      balancedOptions(
        dailyEvent.options,
        dailyEvent.answer,
        daySeed % 3,
        daySeed,
      ),
    [dailyEvent, daySeed],
  );
  const eventResult =
    savedEvent ||
    (eventAnswer ? { correct: eventAnswer === dailyEvent.answer } : null);
  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      <Text style={s.tabTitle}>Телефон</Text>
      <Text style={s.tabSubtitle}>
        Персонажи отвечают по-разному в зависимости от твоих решений
      </Text>
      <Text style={s.section}>СОБЫТИЕ ДНЯ</Text>
      <View style={s.dailyEvent}>
        <Text style={s.dailyEmoji}>{dailyEvent.emoji}</Text>
        <Text style={s.dailyTitle}>{dailyEvent.title}</Text>
        <Text style={s.dailyPrompt}>{dailyEvent.prompt}</Text>
        {eventOptions.map((option) => (
          <Pressable
            key={option}
            disabled={Boolean(eventResult)}
            onPress={() => {
              setEventAnswer(option);
              completeWorldEvent(dailyEvent, option === dailyEvent.answer);
            }}
            style={[
              s.eventOption,
              eventResult && option === dailyEvent.answer && s.correctOption,
              eventAnswer === option &&
                option !== dailyEvent.answer &&
                s.wrongOption,
            ]}
          >
            <Text style={s.eventOptionText}>{option}</Text>
          </Pressable>
        ))}
        {eventResult && (
          <Text
            style={[
              s.eventReward,
              { color: eventResult.correct ? colors.mint : colors.orange },
            ]}
          >
            {eventResult.correct
              ? `Выполнено · +£${dailyEvent.reward} · +1 репутация`
              : "Сегодня награда не получена — завтра будет новое событие"}
          </Text>
        )}
      </View>
      <Text style={s.section}>СООБЩЕНИЯ</Text>
      {messages.length ? (
        messages.map((message) => {
          const savedReply = world.replies?.[message.id];
          const replyOptions = [
            "Thanks for letting me know. I really appreciate it!",
            "That sounds great. I'll get back to you soon.",
          ];
          return (
            <View key={message.id} style={s.message}>
              <View style={s.messageAvatar}>
                <Text style={s.messageAvatarText}>
                  {message.from.slice(0, 1)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.messageTop}>
                  <Text style={s.messageFrom}>{message.from}</Text>
                  <Text style={s.messageDate}>{message.date}</Text>
                </View>
                <Text style={s.messageText}>{message.text}</Text>
                {savedReply ? (
                  <View style={s.sentReply}>
                    <Text style={s.sentReplyLabel}>ТВОЙ ОТВЕТ</Text>
                    <Text style={s.sentReplyText}>{savedReply.text}</Text>
                  </View>
                ) : replyTo === message.id ? (
                  <View style={s.replyOptions}>
                    {replyOptions.map((reply) => (
                      <Pressable
                        key={reply}
                        onPress={() => {
                          replyWorldMessage(message, reply);
                          setReplyTo(null);
                        }}
                        style={s.replyOption}
                      >
                        <Text style={s.replyOptionText}>{reply}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setReplyTo(message.id)}
                    style={s.replyButton}
                  >
                    <Ionicons
                      name="return-down-back"
                      size={16}
                      color={colors.purple}
                    />
                    <Text style={s.replyButtonText}>Ответить по-английски</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={s.emptyTab}>
          <Text style={s.emptyEmoji}>📱</Text>
          <Text style={s.infoTitle}>Сообщений пока нет</Text>
          <Text style={s.infoText}>
            Персонажи напишут после важных сюжетных решений
          </Text>
        </View>
      )}
      <Text style={s.section}>ОТНОШЕНИЯ</Text>
      {relationships.length ? (
        relationships.map(([name, value]) => (
          <View key={name} style={s.relationship}>
            <Text style={s.relationshipEmoji}>{value >= 3 ? "💜" : "🤝"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>{name}</Text>
              <ProgressBar
                value={Math.min(1, value / 5)}
                color={value >= 3 ? colors.pink : colors.purple}
                height={7}
              />
            </View>
            <Text style={s.relationshipValue}>{value}/5</Text>
          </View>
        ))
      ) : (
        <Text style={s.tabSubtitle}>
          Знакомства появятся по мере прохождения истории.
        </Text>
      )}
    </ScrollView>
  );
}

function HomeTab({ world }) {
  const { buyWorldHomeItem } = useProgress();
  const owned = world.homeItems || [];
  const money = world.money ?? 150;
  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      <Text style={s.tabTitle}>Твой дом</Text>
      <Text style={s.tabSubtitle}>
        Обустраивай квартиру деньгами, заработанными в истории
      </Text>
      <View style={s.room}>
        <Text style={s.roomWindow}>🌆</Text>
        <View style={s.roomItems}>
          {owned.length ? (
            owned.map((item) => (
              <View key={item.id} style={s.roomItem}>
                <Text style={s.roomItemEmoji}>{item.emoji}</Text>
                <Text style={s.roomItemText}>{item.title}</Text>
              </View>
            ))
          ) : (
            <View style={s.emptyRoom}>
              <Text style={s.emptyEmoji}>📦</Text>
              <Text style={s.infoText}>Комната пока пустая</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.wallet}>
        <Text style={s.walletEmoji}>💷</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.infoTitle}>Баланс</Text>
          <Text style={s.infoText}>Награды за работу и сюжетные решения</Text>
        </View>
        <Text style={s.walletValue}>£{money}</Text>
      </View>
      <Text style={s.section}>МАГАЗИН ДЛЯ ДОМА</Text>
      {homeShop.map((item) => {
        const bought = owned.some((entry) => entry.id === item.id);
        const enough = money >= item.cost;
        return (
          <View key={item.id} style={[s.shopItem, bought && { opacity: 0.5 }]}>
            <Text style={s.shopEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>{item.title}</Text>
              <Text style={s.infoText}>{item.detail}</Text>
            </View>
            <Pressable
              disabled={bought || !enough}
              onPress={() => buyWorldHomeItem(item)}
              style={[s.buy, (!enough || bought) && { opacity: 0.4 }]}
            >
              <Text style={s.buyText}>
                {bought ? "Куплено" : `£${item.cost}`}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function PassportTab({ world }) {
  const completed = world.completed || [];
  const stars = world.stars || {};
  const totalStars = Object.values(stars).reduce(
    (sum, value) => sum + value,
    0,
  );
  const relationTotal = Object.values(world.relationships || {}).reduce(
    (sum, value) => sum + value,
    0,
  );
  const finished = completed.length === worldLocations.length;
  const ending = !finished
    ? "История продолжается"
    : world.reputation >= 8
      ? "Голос нового поколения"
      : relationTotal >= 7
        ? "Человек, которому доверяют"
        : world.career
          ? `Новая звезда: ${world.career}`
          : "Новая жизнь в Лондоне";
  const skills = [
    [
      "Общение",
      Math.round((completed.length / worldLocations.length) * 100),
      colors.purple,
    ],
    [
      "Точность",
      Math.round((totalStars / (worldLocations.length * 3)) * 100),
      colors.mint,
    ],
    ["Репутация", Math.min(100, (world.reputation || 0) * 10), colors.orange],
    ["Отношения", Math.min(100, relationTotal * 10), colors.pink],
  ];
  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      <View style={s.passport}>
        <Text style={s.passportEmoji}>🇬🇧</Text>
        <Text style={s.passportLabel}>LINGO PASSPORT</Text>
        <Text style={s.passportEnding}>{ending}</Text>
        <Text style={s.passportMeta}>
          {world.career || "Профессия ещё не выбрана"} · {completed.length}/
          {worldLocations.length} глав
        </Text>
      </View>
      <Text style={s.section}>НАВЫКИ ПЕРСОНАЖА</Text>
      {skills.map(([title, value, color]) => (
        <View key={title} style={s.passportSkill}>
          <View style={s.passportSkillTop}>
            <Text style={s.infoTitle}>{title}</Text>
            <Text style={[s.relationshipValue, { color }]}>{value}%</Text>
          </View>
          <ProgressBar value={value / 100} color={color} height={8} />
        </View>
      ))}
      <Text style={s.section}>КЛЮЧЕВЫЕ РЕШЕНИЯ</Text>
      {Object.entries(world.decisions || {}).length ? (
        Object.entries(world.decisions).map(([locationId, decision]) => (
          <View key={locationId} style={s.decision}>
            <Ionicons name="git-branch" size={21} color={colors.purple} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>{decision.title}</Text>
              <Text style={s.infoText}>{decision.outcome}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={s.tabSubtitle}>
          Заверши первую главу, чтобы решение появилось в паспорте.
        </Text>
      )}
    </ScrollView>
  );
}

function WorldMission({ location, onBack }) {
  const { progress, completeWorldLocation } = useProgress();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [decision, setDecision] = useState(null);
  const [consequences, setConsequences] = useState([]);
  const [seed] = useState(() => Date.now());
  const scene = location.scenes[index];
  const sceneLine = scene.careerLines?.[progress.world?.career] || scene.line;
  const earnedStars =
    score >= location.scenes.length
      ? 3
      : score >= location.scenes.length - 1
        ? 2
        : 1;
  const options = useMemo(
    () =>
      scene?.type === "choice"
        ? balancedOptions(scene.options, scene.answer, index, seed)
        : [],
    [scene, index, seed],
  );

  const reset = () => {
    setStarted(true);
    setIndex(0);
    setLives(3);
    setScore(0);
    setAnswer("");
    setSelected("");
    setChecked(false);
    setCorrect(false);
    setFailed(false);
    setFinished(false);
    setDecision(null);
    setConsequences([]);
  };
  const submit = (value) => {
    if (checked) return;
    Keyboard.dismiss();
    const actual = value ?? answer;
    const isCorrect =
      scene.type === "choice"
        ? actual === scene.answer
        : gradeAnswer(actual, scene.answers).status !== "wrong";
    if (scene.type === "choice") setSelected(actual);
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) setScore((current) => current + 1);
    else setLives((current) => Math.max(0, current - 1));
    if (scene.consequence)
      setConsequences((current) => [...current, scene.consequence]);
  };
  const next = () => {
    if (!correct && lives <= 0) {
      setFailed(true);
      return;
    }
    if (index === location.scenes.length - 1) {
      const previousDecision = progress.world?.decisions?.[location.id];
      if (previousDecision) {
        completeWorldLocation(
          location,
          score,
          earnedStars,
          consequences,
          previousDecision,
        );
        setDecision(previousDecision);
      }
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setAnswer("");
    setSelected("");
    setChecked(false);
    setCorrect(false);
  };

  if (!started)
    return (
      <View style={s.container}>
        <Header title={`Глава ${location.order}`} onClose={onBack} />
        <ScrollView contentContainerStyle={s.introContent}>
          <Text style={s.introEmoji}>{location.emoji}</Text>
          <Text style={[s.level, { color: location.color }]}>
            {location.level} · {location.character}
          </Text>
          <Text style={s.introTitle}>{location.title}</Text>
          <Text style={s.introText}>{location.intro}</Text>
          <View style={s.missionInfo}>
            <Info
              icon="chatbubbles"
              title={`${location.scenes.length} сцены`}
              text="Выбор и свободный ввод"
            />
            <Info
              icon="heart"
              title="3 жизни"
              text="Ошибся — история идёт дальше"
            />
            <Info
              icon="gift"
              title={location.reward.title}
              text="Награда за прохождение"
            />
          </View>
          <PrimaryButton
            title="Начать главу"
            icon="play"
            onPress={() => setStarted(true)}
            color={location.color}
          />
        </ScrollView>
      </View>
    );

  if (failed)
    return (
      <View style={s.container}>
        <Header title={location.title} onClose={onBack} />
        <View style={s.result}>
          <Text style={s.resultEmoji}>💔</Text>
          <Text style={s.resultTitle}>Жизни закончились</Text>
          <Text style={s.resultText}>
            Глава не засчитана. Начни её заново — вопросы сохранят естественный
            порядок ответов.
          </Text>
          <View style={s.resultButtons}>
            <PrimaryButton
              title="Пройти заново"
              onPress={reset}
              color={location.color}
            />
            <PrimaryButton
              title="Вернуться на карту"
              onPress={onBack}
              color={colors.cardLight}
            />
          </View>
        </View>
      </View>
    );

  if (finished) {
    if (!decision)
      return (
        <View style={s.container}>
          <Header title="Важное решение" onClose={onBack} />
          <ScrollView contentContainerStyle={s.choiceContent}>
            <Text style={s.choiceEmoji}>⑂</Text>
            <Text style={s.resultTitle}>Как продолжится история?</Text>
            <Text style={s.resultText}>
              Оба ответа правильные по-английски, но приведут к разным
              последствиям.
            </Text>
            {location.storyChoices.map((choice) => (
              <Pressable
                key={choice.id}
                onPress={() => {
                  completeWorldLocation(
                    location,
                    score,
                    earnedStars,
                    consequences,
                    choice,
                  );
                  setDecision(choice);
                }}
                style={[s.storyChoice, { borderColor: `${location.color}66` }]}
              >
                <View
                  style={[
                    s.choiceNumber,
                    { backgroundColor: `${location.color}22` },
                  ]}
                >
                  <Ionicons
                    name="git-branch"
                    size={22}
                    color={location.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.choiceTitle}>{choice.title}</Text>
                  <Text style={s.choiceText}>{choice.text}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    const savedStars = progress.world?.stars?.[location.id] || 1;
    return (
      <View style={s.container}>
        <Header title={location.title} onClose={onBack} />
        <ScrollView contentContainerStyle={s.result}>
          <Text style={s.resultEmoji}>{location.reward.emoji}</Text>
          <Text style={s.resultTitle}>Глава пройдена!</Text>
          <Text style={s.resultStars}>{"⭐".repeat(savedStars)}</Text>
          <Text style={s.resultText}>
            Правильных ответов: {score} из {location.scenes.length}. Получено:{" "}
            {location.reward.title}.
          </Text>
          <View style={s.decisionOutcome}>
            <Text style={s.outcomeLabel}>ТВОЁ РЕШЕНИЕ · {decision.title}</Text>
            <Text style={s.outcomeText}>{decision.outcome}</Text>
          </View>
          {!!consequences.length && (
            <View style={s.outcome}>
              <Text style={s.outcomeLabel}>ТВОЯ ИСТОРИЯ</Text>
              {consequences.map((text, itemIndex) => (
                <Text key={`${text}-${itemIndex}`} style={s.outcomeText}>
                  • {text}
                </Text>
              ))}
            </View>
          )}
          <View style={s.resultButtons}>
            <PrimaryButton
              title="Продолжить историю"
              onPress={onBack}
              color={location.color}
            />
            <PrimaryButton
              title="Переиграть главу"
              onPress={reset}
              color={colors.cardLight}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.container}
    >
      <Header
        title={location.title}
        onClose={onBack}
        right={
          <Text style={s.lives}>
            {"♥".repeat(lives)}
            <Text style={s.lostLives}>{"♡".repeat(3 - lives)}</Text>
          </Text>
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={s.missionContent}
      >
        <ProgressBar
          value={(index + 1) / location.scenes.length}
          color={location.color}
        />
        <Text style={[s.level, { color: location.color }]}>
          СЦЕНА {index + 1} ИЗ {location.scenes.length}
        </Text>
        <View style={s.dialogue}>
          <View
            style={[
              s.characterAvatar,
              { backgroundColor: `${location.color}25` },
            ]}
          >
            <Text style={s.characterEmoji}>{location.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.speaker}>{scene.speaker}</Text>
            <Text style={s.line}>{sceneLine}</Text>
          </View>
          <Pressable
            onPress={() =>
              speak(sceneLine, { language: "en-GB", rate: 0.78 })
            }
            style={s.speak}
          >
            <Ionicons name="volume-high" size={20} color={location.color} />
          </Pressable>
        </View>
        <Text style={s.prompt}>{scene.prompt}</Text>
        {scene.type === "choice" ? (
          options.map((option) => (
            <Pressable
              key={option}
              disabled={checked}
              onPress={() => submit(option)}
              style={[
                s.option,
                checked && option === scene.answer && s.correctOption,
                checked &&
                  selected === option &&
                  option !== scene.answer &&
                  s.wrongOption,
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ))
        ) : (
          <View>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              editable={!checked}
              autoCapitalize="sentences"
              multiline
              placeholder="Напиши ответ на английском"
              placeholderTextColor={colors.textMuted}
              style={s.input}
            />
            {!checked && <Text style={s.hint}>💡 {scene.hint}</Text>}
          </View>
        )}
        {checked && (
          <View
            style={[
              s.feedback,
              { borderColor: correct ? colors.mint : colors.orange },
            ]}
          >
            <Text
              style={[
                s.feedbackTitle,
                { color: correct ? colors.mint : colors.orange },
              ]}
            >
              {correct ? "Отличный ответ" : "Смысл понятен, но лучше так:"}
            </Text>
            {!correct && <Text style={s.correctAnswer}>{scene.answer}</Text>}
            <Text style={s.explanation}>
              {expandExplanation(scene, {
                selected: scene.type === "choice" ? selected : answer,
                topic: location.title,
              })}
            </Text>
            {scene.consequence && (
              <Text style={s.consequence}>↳ {scene.consequence}</Text>
            )}
          </View>
        )}
      </ScrollView>
      <View style={s.bottom}>
        <PrimaryButton
          disabled={!checked && (scene.type === "choice" || !answer.trim())}
          title={
            checked
              ? index === location.scenes.length - 1
                ? "Завершить главу"
                : "Продолжить"
              : scene.type === "choice"
                ? "Выбери ответ"
                : "Проверить ответ"
          }
          onPress={checked ? next : () => submit(answer)}
          color={
            checked ? (correct ? colors.mint : colors.orange) : location.color
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Info({ icon, title, text }) {
  return (
    <View style={s.info}>
      <Ionicons name={icon} size={23} color={colors.purple} />
      <View style={{ flex: 1 }}>
        <Text style={s.infoTitle}>{title}</Text>
        <Text style={s.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "white", fontWeight: "900", fontSize: 17 },
  headerRight: { minWidth: 40, alignItems: "flex-end" },
  worldCounter: { color: colors.mint, fontWeight: "900" },
  mapContent: { padding: 20, paddingBottom: 55 },
  worldHero: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  worldEmoji: { fontSize: 62 },
  worldTitle: { color: "white", fontSize: 25, fontWeight: "900", marginTop: 8 },
  worldText: {
    color: colors.textMuted,
    lineHeight: 21,
    textAlign: "center",
    marginVertical: 10,
  },
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 24,
    marginBottom: 10,
  },
  inventory: { gap: 8 },
  inventoryItem: {
    width: 105,
    minHeight: 90,
    backgroundColor: colors.card,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  inventoryEmoji: { fontSize: 31 },
  inventoryTitle: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  pathRow: { flexDirection: "row", alignItems: "stretch" },
  pathRail: { width: 30, alignItems: "center" },
  pathDot: { width: 14, height: 14, borderRadius: 7, marginTop: 32, zIndex: 1 },
  pathLine: { width: 3, flex: 1, backgroundColor: colors.cardLight },
  location: {
    flex: 1,
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  lockedLocation: { opacity: 0.42 },
  locationIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  locationEmoji: { fontSize: 29 },
  locationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  level: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 4 },
  stars: { fontSize: 10 },
  locationTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 5,
  },
  locationText: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  introContent: { padding: 24, paddingBottom: 50, alignItems: "center" },
  introEmoji: { fontSize: 82, marginTop: 20 },
  introTitle: { color: "white", fontSize: 36, fontWeight: "900", marginTop: 9 },
  introText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 24,
  },
  missionInfo: { width: "100%", gap: 9, marginBottom: 24 },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
  },
  infoTitle: { color: "white", fontWeight: "800" },
  infoText: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  missionContent: { padding: 20, paddingBottom: 25 },
  lives: { color: colors.pink, fontWeight: "900", letterSpacing: 2 },
  lostLives: { color: colors.textMuted },
  dialogue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 15,
    marginTop: 17,
  },
  characterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  characterEmoji: { fontSize: 24 },
  speaker: { color: colors.orange, fontSize: 11, fontWeight: "900" },
  line: {
    color: "white",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 4,
  },
  speak: { padding: 6 },
  prompt: {
    color: "white",
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "900",
    marginVertical: 20,
  },
  option: {
    minHeight: 59,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: {
    color: "white",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "650",
  },
  correctOption: {
    borderColor: colors.mint,
    backgroundColor: "rgba(46,211,183,.10)",
  },
  wrongOption: {
    borderColor: colors.orange,
    backgroundColor: "rgba(255,159,67,.10)",
  },
  input: {
    minHeight: 115,
    color: "white",
    fontSize: 17,
    lineHeight: 24,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 16,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 9 },
  feedback: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.5,
    marginTop: 12,
  },
  feedbackTitle: { fontWeight: "900", fontSize: 16 },
  correctAnswer: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 8,
  },
  explanation: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
  consequence: {
    color: colors.purple,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 10,
  },
  bottom: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  result: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  resultEmoji: { fontSize: 82 },
  resultTitle: {
    color: "white",
    fontSize: 31,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 13,
  },
  resultStars: { fontSize: 27, marginTop: 9 },
  resultText: {
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  resultButtons: { width: "100%", gap: 9, marginTop: 24 },
  outcome: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  outcomeLabel: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  outcomeText: { color: "white", lineHeight: 21, marginTop: 8 },
  money: { color: colors.mint, fontWeight: "900", fontSize: 15 },
  worldTabs: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingBottom: 9,
  },
  worldTab: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  worldTabActive: { backgroundColor: colors.purple },
  worldTabText: { color: colors.textMuted, fontSize: 9, fontWeight: "800" },
  tabContent: { padding: 20, paddingBottom: 55 },
  tabTitle: { color: "white", fontSize: 32, fontWeight: "900" },
  tabSubtitle: { color: colors.textMuted, lineHeight: 21, marginTop: 6 },
  dailyEvent: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(244,185,66,.25)",
  },
  dailyEmoji: { fontSize: 42 },
  dailyTitle: { color: "white", fontSize: 19, fontWeight: "900", marginTop: 7 },
  dailyPrompt: {
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 12,
  },
  eventOption: {
    minHeight: 50,
    justifyContent: "center",
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 7,
  },
  eventOptionText: {
    color: "white",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  eventReward: {
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  message: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
  },
  messageAvatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "rgba(124,92,252,.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  messageAvatarText: { color: colors.purple, fontWeight: "900", fontSize: 18 },
  messageTop: { flexDirection: "row", justifyContent: "space-between" },
  messageFrom: { color: "white", fontWeight: "900" },
  messageDate: { color: colors.textMuted, fontSize: 9 },
  messageText: { color: colors.textMuted, lineHeight: 19, marginTop: 5 },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  replyButtonText: { color: colors.purple, fontWeight: "800", fontSize: 11 },
  replyOptions: { gap: 7, marginTop: 11 },
  replyOption: {
    backgroundColor: "rgba(124,92,252,.13)",
    borderRadius: 13,
    padding: 10,
  },
  replyOptionText: {
    color: "white",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  sentReply: {
    backgroundColor: "rgba(46,211,183,.10)",
    borderRadius: 13,
    padding: 10,
    marginTop: 10,
  },
  sentReplyLabel: {
    color: colors.mint,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sentReplyText: { color: "white", fontSize: 11, lineHeight: 16, marginTop: 4 },
  emptyTab: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 25,
  },
  emptyEmoji: { fontSize: 45, marginBottom: 9 },
  relationship: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
  },
  relationshipEmoji: { fontSize: 27 },
  relationshipValue: { color: colors.purple, fontWeight: "900", fontSize: 12 },
  room: {
    minHeight: 230,
    backgroundColor: "#27283C",
    borderRadius: 26,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomWindow: { fontSize: 58, textAlign: "center" },
  roomItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 15,
  },
  roomItem: {
    minWidth: 82,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.06)",
    borderRadius: 15,
    padding: 9,
  },
  roomItemEmoji: { fontSize: 31 },
  roomItemText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyRoom: { alignItems: "center" },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(46,211,183,.12)",
    borderRadius: 19,
    padding: 15,
    marginTop: 14,
  },
  walletEmoji: { fontSize: 34 },
  walletValue: { color: colors.mint, fontSize: 23, fontWeight: "900" },
  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
  },
  shopEmoji: { fontSize: 34 },
  buy: {
    minWidth: 66,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "rgba(46,211,183,.15)",
    borderRadius: 13,
    alignItems: "center",
  },
  buyText: { color: colors.mint, fontWeight: "900", fontSize: 11 },
  passport: {
    alignItems: "center",
    backgroundColor: "#3B276D",
    borderRadius: 27,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.13)",
  },
  passportEmoji: { fontSize: 57 },
  passportLabel: {
    color: "rgba(255,255,255,.6)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  passportEnding: {
    color: "white",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  passportMeta: {
    color: "rgba(255,255,255,.65)",
    textAlign: "center",
    marginTop: 7,
  },
  passportSkill: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 15,
    marginBottom: 8,
  },
  passportSkillTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  decision: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
  },
  choiceContent: { padding: 24, paddingBottom: 55, alignItems: "center" },
  choiceEmoji: { color: colors.purple, fontSize: 70, fontWeight: "900" },
  storyChoice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 21,
    borderWidth: 1,
    padding: 15,
    marginTop: 13,
  },
  choiceNumber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceTitle: { color: "white", fontWeight: "900", fontSize: 16 },
  choiceText: {
    color: colors.textMuted,
    lineHeight: 18,
    fontSize: 12,
    marginTop: 5,
  },
  decisionOutcome: {
    width: "100%",
    backgroundColor: "rgba(124,92,252,.14)",
    borderRadius: 19,
    padding: 15,
    marginTop: 18,
  },
});
